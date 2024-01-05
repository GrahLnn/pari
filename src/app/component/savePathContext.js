'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { readBinaryFile, writeTextFile, createDir, BaseDirectory } from '@tauri-apps/api/fs';
import { parse as parseTOML, stringify as stringifyTOML } from '@iarna/toml';

const configFile = 'user_config.toml';

// 创建一个 context，它包含两个值：当前的默认保存路径和一个设置该路径的函数
const SavePathContext = createContext({
    defaultSavePath: "",
    setDefaultSavePath: () => { }
});

// 使用默认目录 AppData 作为文件存储的基础目录
const DEFAULT_DIR = BaseDirectory.AppData;

// 准备写文件操作，确保目标文件夹存在
async function prepareWrite() {
    await createDir('users', { dir: DEFAULT_DIR, recursive: true });
}

// 写入文本文件
async function writeInTextFile(filePath, content) {
    await prepareWrite();
    await writeTextFile(filePath, content, { dir: DEFAULT_DIR });
}

// 读取文本文件
async function readTextFile(filePath) {
    return await readBinaryFile(filePath, { dir: DEFAULT_DIR });
}

export function useSavePath() {
    return useContext(SavePathContext);
}

export function SavePathProvider({ children }) {
    const [defaultSavePath, setDefaultSavePath] = useState("");

    useEffect(() => {
        async function loadConfig() {
            try {
                await prepareWrite();
                const fileData = await readTextFile(configFile);
                const config = parseTOML(new TextDecoder().decode(fileData));
                setDefaultSavePath(config.defaultSavePath || "");
            } catch (error) {
                console.error('Config file read error:', error);
                setDefaultSavePath(""); // 如果出错，则设置为空
            }
        }

        loadConfig();

    }, []);
    useEffect(() => {
        async function saveConfig() {
            try {
                // 创建一个对象来表示新的配置
                const newConfig = {
                    defaultSavePath: defaultSavePath
                };

                // 将对象转换为 TOML 格式的字符串
                const configContent = stringifyTOML(newConfig);

                // 写入配置文件
                await writeInTextFile(configFile, configContent);
            } catch (error) {
                console.error('Config file write error:', error);
            }
        }

        if (defaultSavePath) {
            saveConfig();
        }
    }, [defaultSavePath]);

    // 提供 defaultSavePath 和 setDefaultSavePath 到 context
    return (
        <SavePathContext.Provider value={{ defaultSavePath, setDefaultSavePath }}>
            {children}
        </SavePathContext.Provider>
    );
}
