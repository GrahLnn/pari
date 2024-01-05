// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(unused)]

#[warn(non_snake_case)]
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::borrow::Cow;
use std::collections::{HashMap, HashSet};
use std::vec;
use surrealdb::engine::any::Any;
use surrealdb::engine::remote::ws::Ws;
// use surrealdb::opt::auth::Root;
use async_std::fs::File;
use async_std::io::ReadExt;
use blake2::{Blake2s256, Digest};
use once_cell::sync::Lazy;
use std::fs;
use std::path::Path;
use surrealdb::sql::{self, Thing};
use surrealdb::{Result, Surreal};
use tauri::command;

static DB: Lazy<Surreal<Any>> = Lazy::new(Surreal::init);
#[tokio::main]
async fn main() -> Result<()> {
    DB.connect("mem://").await?;
    DB.use_ns("N").use_db("D").await?;
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            exec_create_items,
            exec_select_all_files,
            add_label_and_relates,
            exec_select_all_labels,
            delete_file_and_relates,
            exec_select_part_files,
            create_items_with_labels,
            select_single_item_labels,
            delete_label_for_a_file,
            check_dir_exist,
            update_label,
            reload_create
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    Ok(())
}

#[command]
async fn reload_create(items: Vec<FileThing>) -> Result<()> {
    // dbg!(&items);
    let db = &*DB;
    for record in &items {
        let created: Vec<FileThing> = db
            .create("file")
            .content(FileThing {
                file: record.file.clone(),
                crypto: record.crypto.clone(),
                labels: vec![],
            })
            .await?;
        let copy_record = record.clone();
        if record
            .labels
            .first()
            .map_or(false, |label| label != "Unassigned Label Files")
        {
            for label in &record.labels {
                add_label_and_relates(&record.crypto, label).await?;
            }
        }
    }
    Ok(())
}

#[command]
async fn check_dir_exist(dir: &str) -> Result<bool> {
    let path = Path::new(dir);
    Ok(path.exists())
}

#[command]
async fn create_items_with_labels(files: Vec<&str>, store: &str, labels: Vec<&str>) -> Result<()> {
    let db = &*DB;
    let files_name: Vec<String> = files
        .iter()
        .filter_map(|f| {
            Path::new(f)
                .file_name()
                .and_then(|name| name.to_str())
                .map(|name| name.to_string())
        })
        .collect();
    let mut files_fingerprint: Vec<String> = Vec::new();
    let db_files: Vec<FileThing> = db.select("file").await?;
    for file_path in &files {
        // 异步打开文件
        let mut file = File::open(file_path).await.expect("Failed to open file");

        // 读取文件内容
        let mut contents = Vec::new();
        file.read_to_end(&mut contents)
            .await
            .expect("Failed to read file");

        // 使用BLAKE2s256计算哈希值
        let mut hasher = Blake2s256::new();
        hasher.update(&contents);
        let hash_result = hasher.finalize();

        // 将哈希值转换为十六进制字符串
        let hash_string = format!("{:x}", hash_result);
        if db_files.iter().any(|f| f.crypto == hash_string) {
            println!("file `{}` already exists!", file_path);
            continue;
        }
        files_fingerprint.push(hash_string);
    }
    exec_create_items(files, store).await?;

    for file in files_fingerprint {
        for label in &labels {
            add_label_and_relates(file.as_str(), label).await?;
        }
    }
    Ok(())
}

#[command]
async fn update_label(ord: &str, new: &str) -> Result<()> {
    let db = &*DB;
    let sql = r#"
    let $id = select id from label where label = $ord;
    update $id set label = $new;
    "#;
    let relate = db.query(sql).bind(("ord", ord)).bind(("new", new)).await?;
    Ok(())
}

#[command]
async fn delete_label_for_a_file(fingerprint: &str, label: &str) -> Result<()> {
    let db = &*DB;
    // dbg!(&fingerprint, &label);
    let sql = r#"
    let $file_id = SELECT id FROM file WHERE crypto = $fingerprint;
    let $label_id = SELECT id FROM label WHERE label = $label;
    DELETE array::first($file_id.id)->has_label WHERE out=array::first($label_id.id);
    "#;
    let relate = db
        .query(sql)
        .bind(("fingerprint", fingerprint))
        .bind(("label", label))
        .await?;
    let sql = r#"
      let $related_labels = select out from has_label;
      let $ord_labels = select id from label;
      let $ready_delete_labels = select * from $ord_labels where id NOTINSIDE array::group($related_labels.out);
      delete $ready_delete_labels;
      "#;
    let delete = db.query(sql).await?;
    Ok(())
}

#[command]
async fn select_single_item_labels(fingerprint: &str) -> Result<Vec<FileThing>> {
    let db = &*DB;
    // dbg!(&fingerprint);
    let sql = r#"
    update (select *, ->has_label.out as labels from file where crypto = $fingerprint fetch labels) set labels = array::flatten((select label from (select ->has_label.out as labels from file where crypto = $fingerprint).labels).label);
    update (select *, ->has_label.out as labels from file where crypto = $fingerprint fetch labels) set labels = [];
    "#;
    let mut response = Box::new(db.query(sql).bind(("fingerprint", fingerprint)).await?);

    let labels: Vec<FileThing> = response.take(0)?;
    // dbg!(&labels);
    Ok(labels)
}

#[command]
async fn exec_create_items(files: Vec<&str>, store: &str) -> Result<()> {
    let db = &*DB;
    for file_url in files {
        // 解析文件名
        let file_name = Path::new(file_url)
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or_default()
            .to_string();

        // 构建目标文件路径
        let target_path = Path::new(store).join(&file_name);

        // 将文件复制到指定位置
        fs::copy(file_url, &target_path).expect("Failed to copy file");

        // 读取文件并计算哈希
        let mut file = File::open(&target_path).await.expect("Failed to open file");
        let mut contents = Vec::new();
        file.read_to_end(&mut contents)
            .await
            .expect("Failed to read file");

        let mut hasher = Blake2s256::new();
        hasher.update(&contents);
        let hash = hasher.finalize();
        let hash_str = format!("{:x}", hash);

        // 检查数据库中是否已经存在该文件
        let files: Vec<FileThing> = db.select("file").await?;
        if files.iter().any(|f| f.crypto == hash_str) {
            println!("file `{}` already exists!", file_name);
            continue;
        }

        // 创建数据库记录
        let created: Vec<FileThing> = db
            .create("file")
            .content(FileThing {
                file: file_name.into(),
                crypto: hash_str.into(),
                labels: vec![],
            })
            .await?;
    }
    Ok(())
}

#[command]
async fn exec_select_all_files() -> Result<Vec<FileThing>> {
    let db = &*DB;
    let mut files: Vec<FileThing> = db.select("file").await?;
    let labels: Vec<LabelThing> = db.select("label").await?;
    let label_strings: Vec<String> = labels.into_iter().map(|l| l.label.into_owned()).collect();

    let files_has_label: Vec<FileThing> =
        exec_select_part_files(label_strings.iter().map(|s| s.as_str()).collect()).await?;
    let mut files_has_label_clone = files_has_label.clone();

    let labeled_files: HashSet<Cow<'static, str>> =
        files_has_label.into_iter().map(|f| f.file).collect();
    files.retain(|f| !labeled_files.contains(&f.file));

    files.append(&mut files_has_label_clone);

    for file in &mut files {
        if file.labels.is_empty() {
            file.labels.push("Unassigned Label Files".to_string());
        }
    }
    Ok(files)
}

#[command]
async fn exec_select_part_files(labels: Vec<&str>) -> Result<Vec<FileThing>> {
    let db = &*DB;

    let sql = r#"
    let $modify_select = select *, <-has_label.in as files from label where label in $labels fetch files;
    for $record in $modify_select {
        update $record.files set labels += [$record.label]; 
    };
    let $return_select = select *, <-has_label.in as files from label where label in $labels fetch files;
    update array::group($modify_select.files) set labels = [];
    return array::group($return_select.files);
    "#;

    let mut response = db.query(sql).bind(("labels", labels)).await?;
    let files_has_label: Vec<FileThing> = response.take(4)?;

    Ok(files_has_label)
}

#[command]
async fn exec_select_all_labels() -> Result<Vec<LabelThing>> {
    let db = &*DB;
    let labels: Vec<LabelThing> = db.select("label").await?;
    Ok(labels)
}

#[command]
async fn add_label_and_relates(crypto: &str, label: &str) -> Result<()> {
    let db = &*DB;
    let labels: Vec<LabelThing> = db.select("label").await?;
    dbg!(&labels);
    if labels.iter().any(|l| l.label == label) {
        println!("label `{}` already exists!", label);
    } else {
        let created: Vec<LabelThing> = db
            .create("label")
            .content(LabelThing {
                label: label.to_string().into(),
            })
            .await?;
    }
    // 若这个label已经和这个文件链接了，就不再链接
    let check_files = exec_select_part_files(vec![label]).await?;
    let check_files_name: Vec<String> = check_files
        .iter()
        .filter_map(|f| Some(f.file.clone().into_owned()))
        .collect();
    let check_files_crypto: Vec<String> = check_files
        .iter()
        .filter_map(|f| Some(f.crypto.clone().into_owned()))
        .collect();
    if check_files_crypto.contains(&crypto.to_string()) {
        println!("file `{}` already has label `{}`!", crypto, label);
        return Ok(());
    }

    let sql = r#"
    LET $file_id = SELECT id FROM file WHERE crypto = $titles;
    LET $label_id = SELECT id FROM label WHERE label = $label;
    RELATE $file_id -> has_label -> $label_id;
    "#;
    let relate = db
        .query(sql)
        .bind(("titles", crypto))
        .bind(("label", label))
        .await?;

    Ok(())
}

#[command]
async fn delete_file_and_relates(file: &str, spath: &str) -> Result<()> {
    let db = &*DB;
    let file_path = Path::new(spath).join(file);

    let sql = r#"
    let $file = select id from file where file in $files;
    delete $file;
    "#;
    let relate = db.query(sql).bind(("files", vec![file])).await?;
    let sql = r#"
    let $related_labels = select out from has_label;
    let $ord_labels = select id from label;
    let $ready_delete_labels = select * from $ord_labels where id NOTINSIDE array::group($related_labels.out);
    delete $ready_delete_labels;
    "#;
    let delete = db.query(sql).await?;
    fs::remove_file(file_path).expect("Failed to remove file");
    Ok(())
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct FileThing {
    file: Cow<'static, str>,
    crypto: Cow<'static, str>,
    labels: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct LabelThing {
    label: Cow<'static, str>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Record {
    #[allow(dead_code)]
    id: Thing,
}

// #[command]
// async fn handle_database_operations() -> Result<()> {
//     let db = &*DB;

//     for i in 0..10 {
//         let title = format!("file{}", i + 1);
//         let created: Vec<FileThing> = db
//             .create("file")
//             .content(FileThing {
//                 file: title.into(),
//                 labels: vec![],
//             })
//             .await?;
//     }

//     // 创建标签
//     let labels = vec![
//         "score",
//         "2013",
//         "RebeccaSaunders",
//         "GyörgyLigeti",
//         "audio",
//         "2014",
//     ];
//     for title in labels {
//         let created: Vec<LabelThing> = db
//             .create("label")
//             .content(LabelThing {
//                 label: title.into(),
//             })
//             .await?;
//     }

//     // 关联文件和标签的逻辑
//     let sql = r#"
//     LET $file_ids = SELECT id FROM file WHERE file IN $titles;
//     LET $label_id = SELECT id FROM label WHERE label = $label;
//     RELATE $file_ids -> has_label -> $label_id;
//     "#;
//     let score_files: Vec<String> = (0..8).map(|i| format!("file{}", i + 1)).collect();
//     let relate = db
//         .query(sql)
//         .bind(("titles", score_files))
//         .bind(("label", "score"))
//         .await?;

//     let audio_files: Vec<String> = (8..10).map(|i| format!("file{}", i + 1)).collect();
//     let relate = db
//         .query(sql)
//         .bind(("titles", audio_files))
//         .bind(("label", "audio"))
//         .await?;
//     let year2013_files: Vec<String> = vec![1, 2, 3, 6]
//         .iter()
//         .filter_map(|&i| Some(format!("file{}", i + 1)))
//         .collect();
//     let relate = db
//         .query(sql)
//         .bind(("titles", year2013_files))
//         .bind(("label", "2013"))
//         .await?;
//     let year2014_files: Vec<String> = vec![7]
//         .iter()
//         .filter_map(|&i| Some(format!("file{}", i + 1)))
//         .collect();
//     let relate = db
//         .query(sql)
//         .bind(("titles", year2014_files))
//         .bind(("label", "2014"))
//         .await?;
//     let rs_files: Vec<String> = vec![2, 6, 7]
//         .iter()
//         .filter_map(|&i| Some(format!("file{}", i + 1)))
//         .collect();
//     let relate = db
//         .query(sql)
//         .bind(("titles", rs_files))
//         .bind(("label", "RebeccaSaunders"))
//         .await?;
//     let gl_files: Vec<String> = vec![0, 1]
//         .iter()
//         .filter_map(|&i| Some(format!("file{}", i + 1)))
//         .collect();
//     let relate = db
//         .query(sql)
//         .bind(("titles", gl_files))
//         .bind(("label", "GyörgyLigeti"))
//         .await?;
//     // 查询文件
//     // let files: Vec<File> = db.select("file").await?;
//     // for file in files {
//     //     println!("{:?}", file);
//     // }
//     let sql = r#"
//     let $modify_select = select *, <-has_label.in as files from label where label in $labels fetch files;
//     for $record in $modify_select {
//         update $record.files set labels += [$record.label];
//     };

//     let $return_select = select *, <-has_label.in as files from label where label in $labels fetch files;
//     update array::group($modify_select.files) set labels = [];

//     return array::group($return_select.files);
//     "#;

//     let mut response = db
//         .query(sql)
//         .bind(("labels", vec!["2013", "RebeccaSaunders", "GyörgyLigeti"]))
//         .await?;
//     let files: Vec<FileThing> = response.take(4)?;
//     dbg!(&files);
//     let mut labels_set = HashSet::new();
//     for file in files {
//         labels_set.insert(file.labels);
//     }
//     dbg!(&labels_set);
//     let unique_labels: Vec<Vec<String>> = labels_set.into_iter().collect();

//     dbg!(unique_labels);
//     Ok(())
// }
