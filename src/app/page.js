'use client';

import { useState, useEffect, useLayoutEffect } from "react";
import Modal from './component/modal_new_filter';
import Label from './component/label';
import FLabel from "./component/filterLabel";
import Intro from "./component/intro";
import { open } from '@tauri-apps/api/dialog';
import { invoke } from '@tauri-apps/api/tauri'
import { useSavePath } from "./component/savePathContext";
import { useFilter } from "./component/curFilter";
import { useAllItems } from "./component/itemsContext";
import ModalSetting from "./component/modal_setting";

async function add_item_to_db(file_paths, savePath, class_label) {

  if (class_label.length === 0 || (class_label.length === 1 && class_label[0] === "Unassigned Label Files")) {
    const res = await invoke('exec_create_items', { files: file_paths, store: savePath });
    return res;
  } else {

    const res = await invoke('create_items_with_labels', { files: file_paths, store: savePath, labels: class_label });
    return res;
  }
}

async function selectCurrentFilterFiles(currentFilter) {

  if (currentFilter.labels === "*") {
    const res = await invoke('exec_select_all_files');
    return res;
  } else {
    const res = await invoke('exec_select_part_files', { labels: currentFilter.labels });
    return res;
  }
}

async function add_label(file, label) {
  if (label.trim() === "") {
    return;
  }
  const res = await invoke('add_label_and_relates', { crypto: file, label: label });
  return res;
}

async function delete_file(file, path) {
  await invoke('delete_file_and_relates', { file: file, spath: path });
  return;
}

async function select_a_file_labels(file) {

  const res = await invoke('select_single_item_labels', { fingerprint: file });
  return res;
}

async function delete_a_relate_label_for_file(file, label) {
  const res = await invoke('delete_label_for_a_file', { fingerprint: file, label: label });
  return res;
}

async function get_all_labels() {
  const res = await invoke('exec_select_all_labels');
  const ans = res.map((item) => {
    return item.label;
  });
  return ans;
}

async function checkFilePath(path) {
  const res = await invoke('check_dir_exist', { dir: path });
  return res;
}

async function updateLabel(label, newLabel) {
  const res = await invoke('update_label', { ord: label, new: newLabel });
  return res;
}

const add_icon = (<svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="#909295"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" /></svg>);
const file_icon = (<svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="#909295"><path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" /></svg>);
const waring_icon = (<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="#E5484D"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg>);
const yes_icon = (<svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="green"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg>);
const pen_icon = (<svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="#909295"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>);
const colse_icon = (<svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="#909295"><path d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z" /></svg>);
const filter_icon = (<svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="#909295"><path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" /></svg>);
const setting_icon = (<svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="#909295"><path d="M710-150q-63 0-106.5-43.5T560-300q0-63 43.5-106.5T710-450q63 0 106.5 43.5T860-300q0 63-43.5 106.5T710-150Zm0-80q29 0 49.5-20.5T780-300q0-29-20.5-49.5T710-370q-29 0-49.5 20.5T640-300q0 29 20.5 49.5T710-230Zm-550-30v-80h320v80H160Zm90-250q-63 0-106.5-43.5T100-660q0-63 43.5-106.5T250-810q63 0 106.5 43.5T400-660q0 63-43.5 106.5T250-510Zm0-80q29 0 49.5-20.5T320-660q0-29-20.5-49.5T250-730q-29 0-49.5 20.5T180-660q0 29 20.5 49.5T250-590Zm230-30v-80h320v80H480Zm230 320ZM250-660Z" /></svg>);
const folder_icon = <svg fill="#909295" xmlns="http://www.w3.org/2000/svg" height="12" viewBox="0 -960 960 960" width="12"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z" /></svg>
const add_file_icon = <svg xmlns="http://www.w3.org/2000/svg" height="12" viewBox="0 -960 960 960" width="12" fill="#909295"><path d="M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" /></svg>
const delete_icon = <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="#909295"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
const set_icon = <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="#909295"><path d="m680-240-56-56 182-184-182-184 56-56 240 240-240 240Zm-400 0L40-480l240-240 56 56-182 184 182 184-56 56Zm40-200q-17 0-28.5-11.5T280-480q0-17 11.5-28.5T320-520q17 0 28.5 11.5T360-480q0 17-11.5 28.5T320-440Zm160 0q-17 0-28.5-11.5T440-480q0-17 11.5-28.5T480-520q17 0 28.5 11.5T520-480q0 17-11.5 28.5T480-440Zm160 0q-17 0-28.5-11.5T600-480q0-17 11.5-28.5T640-520q17 0 28.5 11.5T680-480q0 17-11.5 28.5T640-440Z" /></svg>


const LabelBar = ({ labelgroup, selectFile, setFilesList }) => {

  const { defaultSavePath, setDefaultSavePath } = useSavePath();
  const { curFilter, setCurFilter } = useFilter();

  return <div className="group flex bg-[#f3f5f7] dark:bg-[#20212e] transition-colors items-center px-3 py-1.5 text-[13px]"> {/* 高度36px, 因为1rem默认等于16px*/}
    <div className="flex items-center">

      <div className="flex flex-wrap items-center gap-1">{labelgroup.map((label, index) => (
        <Label key={index} label={label} active_state={true} add_close={false} />
      ))}
        <div className="opacity-0 group-hover:opacity-100">
          <div className="flex opacity-60 hover:opacity-80 transition-opacity ml-2 border-2 border-dashed rounded-md px-1 py-0.5 items-center bg-[#fdfdfe] hover:bg-[#f7f9fc] dark:bg-[#21232e] hover:dark:bg-[#21232e] transition-colors dark:border-[#313248]" onClick={async () => {
            const selected = await selectFile();
            await add_item_to_db(selected, defaultSavePath, labelgroup);
            const res = await selectCurrentFilterFiles(curFilter);

            setFilesList(res);
          }}>
            <div className="">{add_icon}</div>
            <div className="text-[12px] text-nowrap">Attach File</div>
          </div>
        </div>
      </div>
    </div>
  </div>
};


const FileItem = ({ curIdx, file, setFilesList, delete_file, filterList, filterIdx, changeListFn, activeSetIdx, setSettingIdxFn }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { defaultSavePath, setDefaultSavePath } = useSavePath();
  const [wasEditing, setWasEditing] = useState(false);
  const [tempClose, setTempClose] = useState(false);
  const { curFilter, setCurFilter } = useFilter();
  const [isHovered, setIsHovered] = useState(false);
  const [showToolBar, setShowToolBar] = useState(false);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    async function update() {
      const res = await select_a_file_labels(file.crypto);
      setLabels(res[0].labels);
    }
    update();
  }, []);

  useLayoutEffect(() => {
    if (wasEditing && !isEditing) {
      // 这里是 isEditing 从 true 变为 false 时执行的代码
      setTempClose(true);

    }
    // 更新 wasEditing 的状态
    setWasEditing(isEditing);
    setInputValue('');
  }, [isEditing, wasEditing]);

  useEffect(() => {
    if (activeSetIdx !== curIdx) {
      setShowToolBar(false);
    }
  }, [activeSetIdx]);


  const stopEditing = async () => {
    setIsEditing(false);

    if (inputValue.trim() === "") {
      return;
    }
    await add_label(file.crypto, inputValue);

    if (filterIdx === 0) {
      const res = await selectCurrentFilterFiles(curFilter);
      setFilesList(res);
    } else {
      const new_list = filterList.map((item, idx) => {
        if (idx === filterIdx) {
          return { ...item, labels: [...item.labels, inputValue] };
        } else {
          return item;
        }
      });
      changeListFn(new_list);
      const res = await selectCurrentFilterFiles(new_list[filterIdx]);
      setFilesList(res);
    }
  };
  const delete_and_update = async (label) => {

    await delete_a_relate_label_for_file(file.crypto, label);
    const res = await selectCurrentFilterFiles(curFilter);
    setFilesList(res);

  }
  return <div className="group relative  min-h-11 flex  justify-between items-center px-3 border-b border-[#edf0f3] dark:border-[#212234] hover:bg-[#fbfbfc] dark:hover:bg-[#1c1d2a] text-[13px] transition-colors" onMouseEnter={() => { setTempClose(false); setIsHovered(true) }} onMouseLeave={() => {
    setIsHovered(false);
  }}>
    <div className="flex">
      <div
        className={` absolute left-0 top-0 w-full h-full px-3 flex items-center  justify-between transition-all z-10 ${activeSetIdx === curIdx ? 'translate-x-0' : 'translate-x-full '}`}
        style={{
          WebkitBackdropFilter: 'blur(9px)',
          backdropFilter: 'blur(9px)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >

        <div id="fileLabels" className="w-full flex gap-1 flex-row-reverse overflow-x-auto items-center">{labels.map((label, index) => (
          <Label key={index} label={label} active_state={true} add_close={true} translate={true} closeFn={delete_and_update} />
        ))}
        </div>
        <div className="flex gap-1">
          <div className="ml-1 dark:hover:bg-[#2a2a39] hover:shadow hover:bg-[#f7f7f7] opacity-60 hover:opacity-100  p-1 rounded-md " onClick={async () => {
            await delete_file(file.file, defaultSavePath);
            const res = await selectCurrentFilterFiles(curFilter);
            setFilesList(res);

          }}>
            <div className="">{delete_icon}</div>
          </div>

          <div className={`collapse`}><div className="ml-1 p-1 rounded-md">{set_icon}</div>
          </div>
        </div>

      </div>
      <div className="flex items-center">
        <div className="mr-2">{file_icon}</div>
        <div className="mr-4 opacity-80 my-2">{file.file}</div>
        {isEditing ?
          <div className="relative border-2 border-dashed  rounded-md px-1 dark:border-[#313248]">
            <span className="inline-block w-full h-0 invisible text-[12px] min-w-[44.46px]">{inputValue}</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  stopEditing();
                }
              }}
              className="w-full h-full inline-block absolute left-0 top-0 border-none border-b border-dashed border-gray-300 text-[12px] px-2 bg-[#ffffff] hover:bg-[#f7f9fc] dark:bg-[#191a23] hover:dark:bg-[#1e1e2b] dark:opacity-70"
              onBlur={stopEditing}
              autoFocus
            />
          </div>
          :
          (tempClose && !isHovered ? <></> : <div className="opacity-0 group-hover:opacity-100 dark:opacity-0 group-hover:dark:opacity-100 transition-opacity">
            <div className="flex items-center rounded-md px-1 py-0.5 border-2 border-dashed transition-colors bg-[#ffffff] hover:bg-[#f7f9fc] dark:bg-[#191a23] hover:dark:bg-[#1e1e2b] dark:border-[#313248] text-[12px] opacity-60 hover:opacity-80 transition-opacity" onClick={() => setIsEditing(true)}>
              <div className="">{add_icon}</div>
              Label
            </div>
          </div>)}
      </div>
    </div>
    <div className={`${activeSetIdx === curIdx ? "opacity-100" : "opacity-0 group-hover:opacity-100"}  transition-opacity z-10`} onClick={async () => {
      // await delete_file(file.file, defaultSavePath);
      // const res = await selectCurrentFilterFiles(curFilter);
      // setFilesList(res);
      if (activeSetIdx === curIdx) {

        setSettingIdxFn(-1);
      }
      else {
        setSettingIdxFn(curIdx);
      }

      const res = await select_a_file_labels(file.crypto);
      setLabels(res[0].labels);

    }}><div className="ml-1 dark:hover:bg-[#2a2a39] hover:shadow hover:bg-[#f7f7f7] opacity-60 hover:opacity-100 transition-all p-1 rounded-md">{set_icon}</div>
    </div>
  </div>
};



export default function Home() {

  const [labels, setLabels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingOpen, setSettingOpen] = useState(false);
  const triggerNewFilter = () => { openFilterArea(true); setIsModalOpen(true) };
  const closeModal = () => setIsModalOpen(false);
  const closeSettingModal = () => setSettingOpen(false);

  const structure_choose = {
    "name": "ALL",
    "labels": "*"
  }


  // 侧边栏filter列表
  const [filterList, setFilterList] = useState([structure_choose]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [activeFilterIndex, setActiveFilterIndex] = useState(0); // 根据保存的状态加载上一次的选择

  const [introIdx, setIntroIdx] = useState(0);

  const { defaultSavePath, setDefaultSavePath } = useSavePath();
  const { allItems, setAllItems } = useAllItems();

  const [firstLoad, setFirstLoad] = useState(true);

  const [filesList, setFilesList] = useState([]);
  const [unique_labels, setUnique_labels] = useState([]);

  const [countResult, setCountResult] = useState(0);

  const [showNoFilesMessage, setShowNoFilesMessage] = useState(false);

  const { curFilter, setCurFilter } = useFilter();
  const [fileSetingIdx, setFileSetingIdx] = useState(-1);
  const [isFileExist, setIsFileExist] = useState(false);
  const [dirNotExistWarning, setDirNotExistWarning] = useState(false);

  useLayoutEffect(() => {
    // async function initFiles() {
    //   const res = await selectCurrentFilterFiles(curFilter);
    //   setFilesList(res);
    //   setCountResult(res.length);
    // }
    if (activeFilterIndex === 0 && allItems.length !== filesList.length) {
      console.log("allItems", allItems);
      console.log("filesList", filesList);
      setFilesList(allItems);
    }

  }, [allItems, filesList]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const exists = await checkFilePath(defaultSavePath);
      if (defaultSavePath !== "") { setIsFileExist(exists); }
    }, 500);
    return () => clearInterval(interval);
  }, [defaultSavePath]);

  useEffect(() => {
    if (!isFileExist && defaultSavePath !== "") {
      setDirNotExistWarning(true);
      setFirstLoad(true);
    } else if (isFileExist && defaultSavePath !== "") {
      setDirNotExistWarning(false);
      setFirstLoad(false);
    }
  }, [isFileExist]);

  useEffect(() => {
    async function update() {
      const res = await get_all_labels();
      setLabels(res);
    }
    update();
    setCurFilter(structure_choose);
  }, []);

  useEffect(() => {
    setCurFilter(filterList[activeFilterIndex]);
    if (activeFilterIndex === 0) {
      openFilterArea(true);
    }
    setFileSetingIdx(-1);
  }, [activeFilterIndex]);

  useEffect(() => {

    const uniqueArrayofArrays = (arrays) => {
      const uniqueArrays = [];
      arrays.forEach(arr => {
        // 检查 uniqueArrays 中是否已存在相等的数组
        if (!uniqueArrays.some(uniqueArr => arraysEqual(arr, uniqueArr))) {
          uniqueArrays.push(arr);
        }
      });
      return uniqueArrays;
    };

    async function updateAllItems() {
      const allitems = await selectCurrentFilterFiles(structure_choose);
      setAllItems(allitems);
    }

    // 直接使用 updatedFiles 计算 unique_labels
    const labels = filesList.map(file => file.labels);

    const uniqueLabels = uniqueArrayofArrays(labels);


    const exitsts = uniqueLabels.some(subArray =>
      ['Unassigned Label Files'].every(item => subArray.includes(item))
    );

    setUnique_labels(uniqueLabels);
    setCountResult(filesList.length);
    updateAllItems();

    // setHandleFilterClick(false);
  }, [filesList]);

  useEffect(() => {
    async function update(item) {
      const res = await selectCurrentFilterFiles(item);
      setFilesList(res);
    }
    if (filesList.length === 0 && activeFilterIndex !== 0) {
      removeItem(activeFilterIndex);
      setActiveFilterIndex(activeFilterIndex - 1);
      update(filterList[activeFilterIndex - 1]);
    }
  }, [filesList, activeFilterIndex]);

  // async function loadConfig() {
  //   try {
  //     const fileData = await readBinaryFile(configFile, { dir: BaseDirectory.App });
  //     const config = parseTOML(new TextDecoder().decode(fileData));
  //     // 设置初始值
  //     // console.log(config);
  //     setDefaultSavePath(config.defaultSavePath || "");
  //     setFirstLoad(false);
  //   } catch (error) {
  //     // 文件不存在或读取错误
  //     // console.error(BaseDirectory.App);
  //     console.error('Config file read error:', error);
  //     setDefaultSavePath(""); // 设置为空
  //   }
  // }

  // async function saveConfig() {
  //   const newConfig = { defaultSavePath: defaultSavePath };
  //   const tomlString = stringifyTOML(newConfig);
  //   setFirstLoad(false);

  //   await writeBinaryFile(configFile, new TextEncoder().encode(tomlString), { dir: BaseDirectory.App });
  // }

  useLayoutEffect(() => {
    // loadConfig(); // 加载配置
    if (defaultSavePath === "") {
      setFirstLoad(true);
    } else {
      setFirstLoad(false);
      // 如果 defaultSavePath 非空，可能还需要执行一些其他操作
    }
    async function initFiles() {
      const res = await selectCurrentFilterFiles(curFilter);
      setFilesList(res);
      setCountResult(res.length);
    }
    if (curFilter.labels !== undefined) {
      initFiles();
      setCurFilter(filterList[activeFilterIndex]);
    }



    const timer = setTimeout(() => {
      setShowNoFilesMessage(true);
    }, 300); // 延迟 1 秒后显示消息，您可以根据需要调整这个时间
    return () => clearTimeout(timer);

  }, [defaultSavePath]);


  async function handleSelectFolder() {
    const selected = await open({
      directory: true,
    });

    return selected;
  }
  async function handleSelectFile() {
    const selected = await open({
      // directory: true,
      multiple: true,
    });

    return selected;
  }




  function setSavePath(path) {
    setDefaultSavePath(path);
  }
  function junpTo() { }


  const introStructure = [
    {
      // "url": "https://lottie.host/5168e5ea-571c-4500-85ea-e03fdef64706/1w6SQEbqYS.json",
      "url": "/GLxN0Quuiy.json",
      "p_text": "Click to choose a folder to store your assets.",
      "icon": folder_icon,
      "final_text": "Made up your mind?",
      // "s_text": "Next Setting!",
      "s_text": "Link Start!",
      "f_len": 'w-[179.34px]',
      // "s_len": 'hover:w-[264.83px]',
      "s_len": 'hover:w-[245.61px]',
      "func": handleSelectFolder,
      // "final": junpTo1,
      "final": junpTo,
      "callback": setSavePath
    },
    // {
    //   "url": "https://lottie.host/c51eef5e-06fc-4774-a50f-ee8ca7146262/GLxN0Quuiy.json",
    //   "p_text": "All Last! Add your first file or folder to start the journey!",
    //   "icon": add_file_icon,
    //   "final_text": "Ready to start?",
    //   "s_text": "Link Start!",
    //   "f_len": 'w-[142.32px]',
    //   "s_len": 'hover:w-[208.6px]',
    //   "func": handleSelectFile,
    //   "final": saveConfig,
    //   "callback": fun1
    // }
  ]

  const names = filterList.map(item => item.name);

  // const changeFilterToggle = (index) => {
  //   setActiveFilterIndex(index);
  //   handleClick();
  // };
  const startEditing = (index) => {
    setEditingIndex(index);
    setEditingText(filterList[index].name);
  };
  const stopEditing = () => {
    setFilterList(currentItems =>
      currentItems.map((item, idx) =>
        idx === editingIndex ? { ...item, name: editingText } : item
      )
    );
    setEditingIndex(null);
  };

  const removeItem = (index) => {
    setFilterList(currentItems => currentItems.filter((_, i) => i !== index));
  };
  const addItem = async (newItem) => {
    setFilterList(currentItems => [...currentItems, newItem]);
    setActiveFilterIndex(filterList.length);
    const res = await selectCurrentFilterFiles(newItem);
    setFilesList(res);
  };

  const side_filter_list = <div className="flex flex-col gap-1">
    <div className="h-3 bg-[#ffffff] dark:bg-[#191a23] transition-colors sticky top-0 z-10" />
    {filterList.map((item, index) => (
      <div key={index} className={`group flex justify-between rounded-lg px-3 py-2 transition-colors hover:border-gray-300 hover:bg-[#f0f3f9] hover:dark:border-neutral-700 hover:dark:bg-[#262736] w-full ${activeFilterIndex === index ? "bg-[#f0f3f9] dark:bg-[#262736] sticky top-2 bottom-10-5 opacity-100 z-10" : "opacity-70 hover:opacity-100"}
        }`} onClick={async () => {
          setActiveFilterIndex(index)
          openFilterArea(true);
          // console.log("idx", index);
          // console.log("activate", activeFilterIndex);
          // invoke('exec_create_items', { names: item.children })
          const res = await selectCurrentFilterFiles(filterList[index]);
          setFilesList(res);

        }}>
        {editingIndex === index ? (
          <input
            type="text"
            // value={editingText}
            placeholder={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            className="bg-[#f0f3f9] dark:bg-[#262736] dark:border-0 w-full mr-2 text-[13px] transition-colors"
            onBlur={stopEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                stopEditing();
              }
            }}
            autoFocus
          />
        ) : (
          <>
            <div className="flex">
              <div className="text-[13px] mr-2">
                {item.name}
              </div>
              {index !== 0 ?
                <div className="opacity-0 flex items-center group-hover:opacity-100 transition-opacity" onClick={() => startEditing(index)}>{pen_icon}</div> : <></>

              }

            </div>
            {index !== 0 ? <div className="opacity-0 flex items-center group-hover:opacity-100 transition-opacity" onClick={() => {
              removeItem(index)
              setTimeout(async () => {
                if (activeFilterIndex === filterList.length - 1)
                  setActiveFilterIndex(activeFilterIndex - 1);
                const res = await selectCurrentFilterFiles(filterList[activeFilterIndex - 1]);
                setFilesList(res);
              }, 50);
            }}>{colse_icon}</div> : <></>}
          </>
        )}
      </div>
    ))}
  </div>

  // 函数来检查两个数组是否相等（无视顺序）
  const arraysEqual = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;
    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();
    return sortedArr1.every((value, index) => value === sortedArr2[index]);
  };

  const [isSidebarToggled, openFilterArea] = useState(true);

  const toggleSidebar = () => {
    openFilterArea(!isSidebarToggled);
  };
  const handleClick = () => {
    // 假设 setIsSidebarToggled 是你用来更新状态的函数
    openFilterArea(true);
  };

  useEffect(() => {
    if (!isSidebarToggled) {
      setModifyIndex(-1);
    }
  }, [isSidebarToggled]);

  const sidebarContent = <>

    <div id="sideList" className="flex flex-col h-screen overflow-y-auto">

      {side_filter_list}
      {/* <div className="sticky bottom-5-5 h-0.5 sticky bottom-0 bg-[#ffffff] dark:bg-[#191a23] transition-colors" /> */}
      {filesList.length === 0
        ? <></>
        : <div className="bg-[#ffffff] dark:bg-[#191a23] sticky bottom-0 transition-colors pb-2 pt-2">
          <button className="flex items-center group rounded-lg px-3 py-2 transition-colors hover:border-gray-300 hover:bg-[#f0f3f9] hover:dark:border-neutral-700 hover:dark:bg-[#262736] w-full bg-[#FDFDFD] dark:bg-[#191a23]" onClick={() => { triggerNewFilter() }}>
            <div>{add_icon}</div>
            <h2 className={`mx-2 max-w-[30ch] opacity-50 text-[12px] `}>
              New Filter
            </h2>
          </button>
        </div>}

      {/* <div className="h-2 sticky bottom-0 bg-[#191a23] dark:bg-[#191a23] transition-colors" /> */}

    </div></>

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 检查是否按下了 Ctrl+F
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        // 可以在这里调用你的自定义搜索逻辑
      }
      if (e.key === 'F5') {
        e.preventDefault();
        // 在这里添加处理 F5 按键的逻辑
        // 例如：刷新数据、保存状态等
      }
    };
    const handleContextMenu = (e) => {
      e.preventDefault(); // 阻止默认的上下文菜单
      // 在这里实现自定义的右键逻辑
    };

    // 添加键盘事件监听器
    window.addEventListener('keydown', handleKeyDown);

    // 添加右键单击事件监听器
    window.addEventListener('contextmenu', handleContextMenu);

    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const changeCurChooseFilter = async (label) => {

    if (!filterList[activeFilterIndex].labels.includes(label)) {
      const new_list = filterList.map((item, idx) => {
        if (idx === activeFilterIndex) {
          return { ...item, labels: [...item.labels, label] };
        } else {
          return item;
        }
      })

      setFilterList(new_list);
      setCurFilter(new_list[activeFilterIndex]);
      const res = await selectCurrentFilterFiles(new_list[activeFilterIndex]);
      setFilesList(res);

    }
    else {
      const new_list = filterList.map((item, idx) => {
        if (idx === activeFilterIndex) {
          return { ...item, labels: item.labels.filter((item) => item !== label) };
        }
        else {
          return item;
        }
      })

      setFilterList(new_list);
      setCurFilter(new_list[activeFilterIndex]);
      const res = await selectCurrentFilterFiles(new_list[activeFilterIndex]);
      setFilesList(res);
    }

    // console.log("filterList", filterList, curFilter);
  }
  // 根据 isSidebarToggled 状态添加或移除边框样式类
  async function setUpdateLabel(label, newlabel) {
    await updateLabel(label, newlabel)
    const res = await get_all_labels();
    setLabels(res);
  }
  const [modifyIndex, setModifyIndex] = useState(-1);
  const borderClasses = isSidebarToggled ? "h-0 mx-4 border-0 border-[#edf0f3] dark:border-[#212234]" : "p-2 border-2 rounded-md border-[#edf0f3] dark:border-[#212234] dark:bg-[#262733] h-48 flex flex-col m-2 shadow-lg";
  const filterButton_bg = isSidebarToggled ? "bg-[#FDFDFD] dark:bg-[#262736] transition-colors" : "bg-[#f3f5f7] dark:bg-[#2c2d42] transition-colors";
  const opac_by_filter = isSidebarToggled ? "" : "opacity-60";
  const filterArea = (
    <div className={`slide-transition ${borderClasses}`} >
      <div id="filterArea" className="overflow-y-auto">
        <div className="flex flex-wrap gap-1">
          {labels.map((label, index) => {
            const curFilterChooseLabel = filterList[activeFilterIndex].labels;
            return <FLabel key={index} label={label} active_state={curFilterChooseLabel.includes(label) ? true : false} updateFn={changeCurChooseFilter} forChoose={true} addModify={true} isAreaOpen={isSidebarToggled} modifyIdx={modifyIndex} setModifyIdx={setModifyIndex} labelIdx={index} updateLabelFn={setUpdateLabel} />
          })}
        </div>
      </div>
    </div>
  );

  // const savePath = useSavePath();

  return (
    <>
      <div className="flex h-screen bg-[#ffffff] dark:bg-[#191a23] select-none relative transition-colors " >
        <div className="fixed bottom-2 left-0 w-full flex justify-center z-10 pointer-events-none">
          {dirNotExistWarning ? <div className="fixed bottom-2 left-0 w-full flex z-10 pointer-events-none p-8">
            <div className={`sticky bottom-2 flex justify-between items-center border border-gray-300 bg-[#f3f5f7] dark:bg-[#2c2d42] py-1 px-2 backdrop-blur-2xl dark:border-[#444556] rounded-md text-[12px] shadow transition-all w-64 ${dirNotExistWarning ? 'opacity-100 scale-100 ' : 'opacity-0 scale-50'}`}>
              <div>{waring_icon}</div>
              <div className="opacity-70 ml-2">You have modified the storage folder! Please restore or reset it!!</div>
            </div>
          </div> : <></>}
          <div className="sticky bottom-2 flex justify-center border border-gray-300 bg-[#f3f5f7] dark:bg-[#2c2d42] py-1 px-2 backdrop-blur-2xl dark:border-[#444556] rounded-full text-[12px] shadow transition-colors">
            {waring_icon}
            <div className="opacity-70 ">This is a highly experimental demo. Do not use it in production.</div>
          </div>
        </div>
        {firstLoad && showNoFilesMessage
          ? <Intro
            animat_url={introStructure[introIdx].url}
            p_text={introStructure[introIdx].p_text}
            s_text={introStructure[introIdx].s_text}
            func={introStructure[introIdx].func}
            len1={introStructure[introIdx].f_len}
            len2={introStructure[introIdx].s_len}
            final_fun={introStructure[introIdx].final}
            f_text={introStructure[introIdx].final_text}
            icon={introStructure[introIdx].icon}
            callback={introStructure[introIdx].callback} />
          : <>
            <ModalSetting isOpen={isSettingOpen} onClose={closeSettingModal} />
            <Modal isOpen={isModalOpen} onClose={closeModal} onAddItem={addItem} checkList={names} />
            <aside id='sidebar' className=" w-48 flex-none items-center border-r border-[#edf0f3] dark:border-[#212234] px-2">
              {/* <div className="h-2 bg-[#ffffff] dark:bg-[#191a23] transition-colors" /> */}
              {/* 侧边栏内容 */}

              {sidebarContent}
              {/*  */}
              {/* <div className="h-2 bg-[#ffffff] dark:bg-[#191a23] transition-colors" /> */}

            </aside>

            {/* 主内容区域 */}
            {filesList.length === 0
              ? <>
                <div className="flex flex-col items-center justify-center grow transition opacity-100">
                  <lottie-player src="/bOVIlWObgc.json" background="Transparent" speed="1" style={{ width: '150px', height: '150px' }} loop autoplay direction="1" mode="normal"></lottie-player>
                  <span className="text-[13px] opacity-60 dark:opacity-70">
                    You have no files yet. Try add some.
                  </span>
                  <button className={`flex gap-1 items-center border border-gray-300 hover:bg-[#f3f5f7] hover:dark:bg-[#343647]  bg-[#fefffe] dark:bg-[#2c2d42] py-1 px-2 backdrop-blur-2xl dark:border-[#444556] rounded-full text-[12px] shadow transition-all mt-4 opacity-100`}
                    onClick={async () => {
                      const selected = await handleSelectFile();
                      await add_item_to_db(selected, defaultSavePath, []);
                      const res = await selectCurrentFilterFiles(curFilter);
                      setFilesList(res);
                    }}>
                    {add_file_icon}
                  </button>
                </div>
              </>
              : <main id='mainarea' className=" h-screen flex flex-col w-full">
                <div className="w-full flex justify-between items-center h-14 bg-[#ffffff] dark:bg-[#191a23] z-10 px-2 border-b-2 border-[#f3f5f7] dark:border-[#212234] py-2 transition-colors">
                  <div className="flex items-center group rounded-md px-2 py-1 shadow transition-colors hover:border-gray-300 hover:dark:border-neutral-700 bg-[#FDFDFD] dark:bg-[#262736]">
                    {yes_icon}
                    <div className="text-[13px] opacity-13 mx-1">
                      Results
                    </div>
                    <div className="opacity-100 py-0.5 px-1 rounded-md bg-[#fefffe] shadow-sm dark:bg-[#20212e] border border-transparent flex items-center group-hover:opacity-100 transition-opacity text-[12px] transition-colors">
                      {countResult}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {activeFilterIndex === 0 ? <></> : <button className={`cursor-pointer flex items-center group rounded-md px-2 py-1 shadow transition-colors hover:border-gray-300 hover:bg-[#f0f3f9] hover:dark:border-neutral-700 ${filterButton_bg} hover:dark:bg-[#2c2d42] opacity-70`} onClick={async () => {

                      const res = await get_all_labels();
                      setLabels(res);
                      toggleSidebar();
                    }}>
                      {filter_icon}
                      <div className="text-[13px] opacity-13 mx-1">
                        Filter
                      </div>
                      <div className="opacity-100 py-0.5 px-1 rounded-md bg-[#fefffe] shadow-sm dark:bg-[#20212e] border border-transparent flex items-center group-hover:opacity-100 transition-opacity text-[12px] transition-colors">
                        {filterList[activeFilterIndex].labels.length}
                      </div>
                    </button>}

                    <button className="flex items-center group rounded-md px-2 py-1 shadow transition-colors hover:border-gray-300 hover:bg-[#f0f3f9] hover:dark:border-neutral-700 bg-[#fbfbfc] dark:bg-[#262736] hover:dark:bg-[#2c2d42] opacity-70" onClick={() => setSettingOpen(true)}>
                      {setting_icon}
                      <div className="text-[13px] opacity-13 mx-1">
                        View Setting
                      </div>

                    </button>

                  </div>
                </div>

                <div className="w-full">{filterArea}</div>

                <div className={`flex-1 overflow-y-auto overflow-x-hidden w-full border-t-2 border-[#edf0f3] dark:border-[#212234] transition-opacity ${opac_by_filter}`} onClick={handleClick}>
                  {unique_labels.map((labelGroup, index) => {

                    return <div key={index}>
                      <LabelBar labelgroup={labelGroup} selectFile={handleSelectFile} setFilesList={setFilesList} />
                      {filesList
                        .map((file, idx) => ({ file, idx }))
                        // 然后，对这些对象进行过滤
                        .filter(({ file }) => arraysEqual(file.labels, labelGroup))
                        // 最后，映射到FileItem组件
                        .map(({ file, idx }) =>
                          <FileItem key={idx} curIdx={idx} file={file} setFilesList={setFilesList} delete_file={delete_file} filterList={filterList} filterIdx={activeFilterIndex} changeListFn={setFilterList} activeSetIdx={fileSetingIdx} setSettingIdxFn={setFileSetingIdx} />
                        )}
                    </div>
                  }
                  )}

                  {(unique_labels.some(subArray =>
                    ['Unassigned Label Files'].every(item => subArray.includes(item))
                  )) || activeFilterIndex !== 0 ? <></> : <>
                    <div className="flex bg-[#f3f5f7] dark:bg-[#20212e] transition-colors items-center px-3 py-1.5 text-[13px]">
                      <div className="flex items-center" />
                    </div>
                    <div className="group min-h-11 flex items-center px-3 border-b border-[#edf0f3] dark:border-[#212234] hover:bg-[#fbfbfc] dark:hover:bg-[#1c1d2a] text-[13px] transition-colors" onClick={async () => {
                      const selected = await handleSelectFile();
                      await add_item_to_db(selected, defaultSavePath, []);
                      const res = await selectCurrentFilterFiles(curFilter);

                      setFilesList(res);
                    }}> {/* 高度44px dark border #212234*/}
                      <div className="mr-2">{add_icon}</div>
                      <div className="mr-4 opacity-60 my-2 group-hover:opacity-80 transition-opacity">Attach files without Lables</div>
                    </div>
                  </>}
                  {/* <div className="w-64 flex overflow-x-auto whitespace-nowrap ">{["sb", "rb", "jk", "yknz", "test", "test", "test", "test", "test", "test", "test", "test", "test"].map((label, index) => (
                    <Label key={index} label={label} active_state={true} add_close={true} translate={true} />
                  ))}
                  </div> */}

                  <div className="h-14 " />
                </div>

              </main>}
          </>}



      </div>


    </>
  )
}


// <div class="flex flex-col">
//   <div class="h-64 overflow-y-auto">
//   <!-- 这里放第一个元素的内容，内容足够多以便可以滚动 -->
// </div>
// <div class="h-64 overflow-y-auto">
//   <!-- 这里放第二个元素的内容，内容足够多以便可以滚动 -->
// </div>
// </div>