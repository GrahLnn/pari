"use client";
import React, { useRef, useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web'
import styles from './label.css'
const close_icon = <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="#909295"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>;
const pen_icon = (<svg xmlns="http://www.w3.org/2000/svg" height="12" viewBox="0 -960 960 960" width="12" fill="#909295"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>);

const Label = ({ label, active_state, add_close, translate = false, closeFn = (() => { }), updateFn = (() => { }), forChoose = false, addModify = false }) => {


    return <div className={` flex items-center group rounded-md px-1 py-0.5 border transition-all hover:bg-[#fbfbfc] hover:dark:bg-[#343647] hover:opacity-90 ${active_state && !translate && !forChoose ? "border-gray-300 bg-[#fbfbfc] dark:border-[#494b65] dark:bg-[#343647] opacity-80" : "bg-[#ffffff] dark:bg-[#303142] dark:border-[#3f4056] opacity-70 dark:opacity-60"} ${active_state && !translate && forChoose ? "border-gray-400 bg-[#fbfbfc] dark:border-[#858699] dark:bg-[#343647] opacity-80" : ""}`} onClick={() => updateFn(label)} >

        <div className="text-[12px] mx-1">
            {label}
        </div>
        {add_close ? <div className='opacity-60 hover:opacity-100 transition-opacity' onClick={() => closeFn(label)}>{close_icon}</div> : <></>}
        {addModify ? <div className='opacity-60 hover:opacity-100 transition-opacity' onClick={() => closeFn(label)}>{pen_icon}</div> : <></>}
    </div>

};

export default Label;
