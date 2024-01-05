'use client';
import React, { useState, useEffect, useCallback } from 'react';
import './modal_new_filter.css';
// import Label from './label';
import { invoke } from '@tauri-apps/api/tauri'

const Label = ({ label, active_state }) => (
    <div className={`flex items-center group rounded-md px-1 py-0.5 border transition-all  hover:bg-[#fbfbfc]  hover:dark:bg-[#343647] hover:opacity-70 ${active_state ? "border-gray-400 bg-[#fbfbfc] dark:border-[#494b65] dark:bg-[#343647] opacity-80 dark:hover:opacity-100 hover:opacity-100" : "bg-[#ffffff] dark:bg-[#303142] dark:border-[#3f4056] opacity-70 dark:opacity-60"}`}>
        {/* <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="green"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg> */}
        <div className="text-[12px] mx-1">
            {label}
        </div>
        {/* <div className="opacity-100 py-0.5 px-1 rounded-2xl bg-[#f3f5f7] dark:bg-[#191a23] border border-transparent flex items-center group-hover:opacity-100 transition-opacity text-[10px]">
          23
        </div> */}
    </div>
);

const right_icon = (<svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="#909295"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" /></svg>);
const paperclip_icon = (<svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="#909295"><path d="M460-80q-92 0-156-64t-64-156v-420q0-66 47-113t113-47q66 0 113 47t47 113v380q0 42-29 71t-71 29q-42 0-71-29t-29-71v-380h60v380q0 17 11.5 28.5T460-300q17 0 28.5-11.5T500-340v-380q0-42-29-71t-71-29q-42 0-71 29t-29 71v420q0 66 47 113t113 47q66 0 113-47t47-113v-420h60v420q0 92-64 156T460-80Z" /></svg>);
const waring_icon = (<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="#E5484D"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg>);
// const labels = [
//     "GyörgyLigeti",
//     "KarlheinzStockhausen",
//     "IannisXenakis",
//     "MortonFeldman",
//     "JohnCage",
//     "LucianoBerio",
//     "SteveReich",

// ]

const getUniqueName = (baseName, checkList) => {
    let count = 1;
    let newName = `${baseName} ${count}`;
    // 检查列表中是否包含 newName，如果包含则递增计数器并重复检查
    while (checkList.includes(newName)) {
        newName = `${baseName} ${count}`;
        count++;
    }
    return newName;
};

const Modal = ({ isOpen, onClose, onAddItem, checkList }) => {


    const [isShowing, setIsShowing] = useState(false);
    const [isEditing, setIsEditing] = useState(true); // 控制是否显示输入框
    const [editingText, setEditingText] = useState(''); // 存储输入框的文本
    const [item, setItem] = useState(""); // 显示的文本，可以根据需要进行初始化
    const [chooseLabel, setChooseLabel] = useState([]);
    const [count, setCount] = useState(0);

    const [labels, setLabels] = useState([]);
    const [warningCount, setWarningCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);


    // 开始编辑
    const startEditing = () => {
        setEditingText(item); // 将当前文本设置为编辑文本
        setIsEditing(true); // 开启编辑模式
    };

    // 停止编辑
    const stopEditing = () => {
        if (editingText.trim() !== "") {
            setItem(editingText.trim());
        } // 更新显示的文本为编辑后的文本
        setIsEditing(false); // 关闭编辑模式
    };

    useEffect(() => {
        async function get_all_labels() {
            const res = await invoke('exec_select_all_labels');
            const labels = res.map(item => item.label);

            return labels;
        }
        if (isOpen) {
            setIsShowing(true);
            setIsEditing(true);
            const unique_name = getUniqueName('cack-name', checkList);
            setItem(unique_name);
            get_all_labels().then((res) => {
                setLabels(res);
            });
        }

    }, [isOpen]);

    useEffect(() => {
        if (warningCount === 5) {
            setShowWarning(true);
            setTimeout(() => {
                setShowWarning(false);
                setWarningCount(0);
            }, 5000);
        }
    }, [warningCount]);


    useEffect(() => {
        if (isOpen && isShowing) {
            setCount(chooseLabel.length);
        }
    }, [isOpen, isShowing, chooseLabel]);

    const handleClose = () => {
        setEditingText('');
        setItem('');
        setChooseLabel([]);
        setCount(0);
        setIsShowing(false);
    };

    const handleTransitionEnd = () => {
        if (!isShowing) {

            onClose(); // 关闭模态框
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target.id === "ModalCenteredScrollable") {

            handleClose(); // 开始关闭动画
        }
    };

    const handleAddItem = () => {
        // 在这里定义如何获取新项（newItem），可能是来自输入框或其他逻辑
        if (chooseLabel.length !== 0) {
            const newItem = { "name": item, "labels": chooseLabel };
            console.log(newItem);
            onAddItem(newItem);
            handleClose();
        } else {
            setWarningCount(warningCount + 1);
        }

    };

    if (!isOpen && !isShowing) return null;

    return (
        <div
            className={`fixed inset-0 w-full h-full bg-[#ffffff] dark:bg-[#191a23] bg-opacity-60 dark:bg-opacity-50 z-50 flex justify-center items-start transition-all  ${isShowing ? 'opacity-100' : 'opacity-0'}`}
            // style={{ marginBottom: 'max(0px, calc(25%))' }}
            id="ModalCenteredScrollable"
            onClick={handleBackdropClick}
            onTransitionEnd={handleTransitionEnd}
            role="dialog"
            aria-modal="true"
        >

            {showWarning ? <div className="fixed bottom-2 left-0 w-full flex z-10 pointer-events-none p-8">
                <div className={`sticky bottom-2 flex justify-between items-center border border-gray-300 bg-[#f3f5f7] dark:bg-[#2c2d42] py-1 px-2 backdrop-blur-2xl dark:border-[#444556] rounded-md text-[12px] shadow transition-colors w-64 ${showWarning ? 'opacity-100 scale-100 ' : 'opacity-0 scale-50'}`}>
                    <div>{waring_icon}</div>
                    <div className="opacity-70 ml-2">You need to select some labels in order to create.</div>
                </div>
            </div> : <></>}
            <div className={`modal flex flex-col modal-dialog-centered relative pointer-events-none rounded-lg transition-all duration-300 border dark:border-[#38394c] border-[#d8d8d8] ${isShowing ? 'opacity-100 scale-100 ' : 'opacity-0 scale-50'}`}
                style={{
                    boxShadow: "0 12px 100px 25px rgb(0 0 0 / 0.3)",
                    // backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    WebkitBackdropFilter: 'blur(7px)',
                    backdropFilter: 'blur(7px)',
                }}>


                <div className={` modal-content border-none relative flex flex-col justify-between  pointer-events-auto bg-white rounded-md text-current w-[640px] h-80 bg-[#ffffff] dark:bg-[#262733] bg-opacity-50 dark:bg-opacity-50`}
                >

                    <div className='w-full py-4 px-4 flex justify-between items-center'>
                        <div className='flex w-full gap-2 items-center'>
                            <div className="flex items-center group rounded px-1 py-0.5 shadow transition-colors border-1 border-[#e6e6e6] bg-[#FDFDFD] dark:bg-[#2e2f3e] bg-opacity-60 dark:bg-opacity-50">
                                <div className="text-[12px] opacity-40 mx-1">
                                    New Filter
                                </div>
                            </div>
                            <div className='opacity-40 text-[12px]'>{right_icon}</div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    // value={editingText}
                                    placeholder={item}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="flex-1 bg-[#ffffff] dark:bg-[#262736] bg-opacity-0 dark:bg-opacity-0 dark:border-0 mr-2 text-[13px] transition-all"
                                    onBlur={stopEditing}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            stopEditing();
                                        }
                                    }}
                                    autoFocus
                                />
                            ) : (

                                <div className="flex items-center group rounded py-0.5" onClick={startEditing}>
                                    <div className="text-[13px] opacity-80 mt-0.25 text-[#2e2e2e] dark:text-[#dadbe8]">
                                        {item}
                                    </div>
                                </div>

                            )}
                        </div>


                        <div className="flex opacity-70 py-0.5 px-1 rounded-md bg-[#fefffe] shadow-sm dark:bg-[#2e2f3e] border border-transparent flex items-center group-hover:opacity-100 transition-opacity text-[12px] transition-colors dark:border-[#3f4056] ml-4">
                            {count}
                        </div>
                    </div>
                    <div className='h-full'>
                        <div id='modalLabelList' className="overflow-y-auto px-4 ">
                            <div className="flex flex-wrap gap-1">
                                {labels.map((label, index) => {
                                    return (
                                        <div key={index} onClick={() => {
                                            if (chooseLabel.includes(label)) {
                                                setChooseLabel(chooseLabel.filter(item => item !== label))
                                            } else {
                                                setChooseLabel([...chooseLabel, label])
                                            }
                                        }}>
                                            <Label label={label} active_state={chooseLabel.includes(label)} />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className='h-2'></div>
                    </div>

                    <div disabled className='h-18 flex items-center py-2 px-2 justify-between border-t dark:border-[#38394c] border-[#d8d8d8]'>
                        <div className='cursor-not-allowed dark:hover:bg-[#373747] hover:bg-[#f7f7f7] p-1.5 rounded-md opacity-60 hover:opacity-100 transition-all ml-2'><div className='rotate-45'>{paperclip_icon}</div></div>
                        <button className="flex items-center group rounded px-1 py-0.5 shadow transition-colors border-1 border-[#e6e6e6] bg-[#6d77d4] dark:bg-[#575ac6] hover:bg-[#6570ca] hover:dark:bg-[#6466d8]">
                            <div className="text-[12px] opacity-100 mx-2 my-1 text-[#fffeff]" onClick={handleAddItem}>
                                Create filter
                            </div>
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default Modal;