'use client';
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { readBinaryFile, writeTextFile, createDir, BaseDirectory } from '@tauri-apps/api/fs';
import { invoke } from '@tauri-apps/api/tauri'

const allItemsFile = 'all_items.json';
const DEFAULT_DIR = BaseDirectory.AppData;

// 创建一个新的 context
const AllItemsContext = createContext({
    allItems: [],
    setAllItems: () => { }
});

// 准备写文件操作，确保目标文件夹存在
async function prepareWrite() {
    await createDir('users', { dir: DEFAULT_DIR, recursive: true });
}

// 写入 JSON 文件
async function writeInJsonFile(filePath, content) {
    await prepareWrite();
    await writeTextFile(filePath, JSON.stringify(content), { dir: DEFAULT_DIR });
}

// 读取 JSON 文件
async function readJsonFile(filePath) {
    try {
        const fileData = await readBinaryFile(filePath, { dir: DEFAULT_DIR });
        const config = JSON.parse(new TextDecoder().decode(fileData));
        console.log(config);
        invoke('reload_create', { items: config });
        return config;
    } catch (error) {
        console.error('JSON file read error:', error);
        return null; // 如果出错，则返回 null
    }
}

export function useAllItems() {
    return useContext(AllItemsContext);
}

export function AllItemsProvider({ children }) {
    const [allItems, setAllItems] = useState([]);
    const isLoaded = useRef(false); // 新状态来追踪是否加载过数据

    useEffect(() => {
        if (!isLoaded.current) {
            async function loadItems() {
                const items = await readJsonFile(allItemsFile);
                if (items) {
                    setAllItems(items);
                }

            }
            isLoaded.current = true;
            loadItems();
        }
    }, []);

    useEffect(() => {
        async function saveItems() {
            try {
                await writeInJsonFile(allItemsFile, allItems);
            } catch (error) {
                console.error('JSON file write error:', error);
            }
        }

        // 可以根据实际情况调整保存的触发条件
        if (allItems.length > 0 && isLoaded.current) {
            saveItems();
        }
    }, [allItems]); // 依赖于 allItems 和 isLoaded

    return (
        <AllItemsContext.Provider value={{ allItems, setAllItems }}>
            {children}
        </AllItemsContext.Provider>
    );
}
