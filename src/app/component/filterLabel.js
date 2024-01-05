"use client";
import React, { useRef, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri'



const close_icon = <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="#909295"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>;
const pen_icon = (<svg xmlns="http://www.w3.org/2000/svg" height="12" viewBox="0 -960 960 960" width="12" fill="#909295"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>);
const done_icon = <svg xmlns="http://www.w3.org/2000/svg" height="12" viewBox="0 -960 960 960" width="12" fill="#909295"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" /></svg>

const FLabel = ({ label, active_state, translate = false, updateFn = (() => { }), forChoose = false, addModify = false, isAreaOpen, modifyIdx, setModifyIdx, labelIdx, updateLabelFn }) => {
    const [startInput, setStartInput] = useState(false);
    const [editingText, setEditingText] = useState("");
    const [labelText, setLabelText] = useState(label);
    const [isHovered, setIsHovered] = useState(false);

    const to_update = async () => {
        setModifyIdx(-1);
        setEditingText("");
        setStartInput(false)
        if (editingText.trim() !== "" && editingText.trim() !== label) {
            console.log(label, editingText.trim());
            await updateLabelFn(label, editingText.trim());
            setLabelText(editingText.trim());
        }
    };

    useEffect(() => {
        if (!isAreaOpen) { setStartInput(false); setLabelText(label); setEditingText(""); }
    }, [isAreaOpen]);

    useEffect(() => {
        if (modifyIdx !== labelIdx) { setStartInput(false); }
    }, [modifyIdx]);

    return <div className={` flex items-center group rounded-md px-1 py-0.5 border transition-all hover:bg-[#fbfbfc] hover:dark:bg-[#343647] hover:opacity-90 ${active_state && !translate && !forChoose ? "border-gray-300 bg-[#fbfbfc] dark:border-[#494b65] dark:bg-[#343647] opacity-80" : "bg-[#ffffff] dark:bg-[#303142] dark:border-[#3f4056] opacity-70 dark:opacity-60"} ${active_state && !translate && forChoose ? "border-gray-400 bg-[#fbfbfc] dark:border-[#858699] dark:bg-[#343647] opacity-80" : ""}`}  >
        {startInput
            ? <div className='relative' style={{ height: '18px' }}>
                <span className="inline-block w-full h-0 invisible text-[12px]  mx-1">{editingText.length > label.length ? editingText : label}</span>
                <input className="inline-block absolute left-1 top-0 w-full h-full text-[12px]  bg-[#fbfbfc] dark:bg-[#343647]" type="text" value={editingText} placeholder={label} onChange={(e) => { setEditingText(e.target.value) }} autoFocus onBlur={() => {
                    if (!isHovered) {
                        setModifyIdx(-1);
                        setEditingText("");
                        setStartInput(false)
                    }

                }} onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        to_update()
                    }
                }} />
            </div>
            : <div className="text-[12px] mx-1" onClick={() => updateFn(label)}>
                {labelText}
            </div>}


        {addModify ? <div className='opacity-60 hover:opacity-100 transition-opacity ml-1' onClick={async () => {

            if (modifyIdx === labelIdx) {
                to_update()
            } else {
                setStartInput(!startInput);
                setModifyIdx(labelIdx)
            }

        }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>{modifyIdx === labelIdx ? done_icon : pen_icon}</div> : <></>}
    </div>

};

export default FLabel;
