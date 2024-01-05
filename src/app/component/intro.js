"use client";
import React, { useEffect, useRef, useState } from 'react';



const Intro = ({ animat_url, p_text, s_text, func, len1, len2, final_fun, f_text, icon, callback }) => {
    const [isHovered, setIsHovered] = useState(false);
    const lottieRef = useRef(null); // 创建一个 ref 来引用 lottie-player 元素
    const [baseLen, setBaseLen] = useState(len1);
    const [hoverLen, setHoverLen] = useState(len2);

    const [path, setPath] = useState("");
    const [showAdd, setShowAdd] = useState("opacity-100");
    const [shouldShow, setShouldShow] = useState(true);


    useEffect(() => {
        if (lottieRef.current) {
            lottieRef.current.load(animat_url); // 使用 load 方法更新动画
            setPath("");
            setShowAdd("opacity-100");
        }
    }, [animat_url]); // 当 animat_url 改变时，这个 useEffect 将被触发

    useEffect(() => {
        setBaseLen(len1);
        setHoverLen(len2);
    }, [len1, len2]);

    // useEffect(() => {
    //     setIsHovered(false);
    // }, [path]);



    // Have you made up your mind?
    return (
        <div className="flex flex-col items-center justify-center grow transition opacity-100">
            <lottie-player src={animat_url} background="transparent" speed="1" style={{ width: '250px', height: '250px' }} loop autoplay direction="1" mode="normal" />
            <div className={`h-4`} />
            {path !== "" ? <div
                className={`${path !== "" ? "dark:bg-[#303143] dark:border-[#3f4056] dark:hover:border-[#494b65] border shadow" : ""} cursor-pointer button-container flex items-center  py-4 px-6 rounded-xl transition-all ${baseLen} ${hoverLen}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => {
                    setBaseLen("w-0 opacity-0");
                    setHoverLen("");
                    setShowAdd("opacity-0");
                    setTimeout(() => {
                        final_fun();
                        callback(path);
                    }, 200);
                }}
            >
                <span className="button-text default-text text-[13px] opacity-60 dark:opacity-70">
                    {f_text}
                </span>
                <span className={`button-text hover-text text-[13px] text-[#FF34A2] dark:text-[#FF95CE] ${isHovered ? 'expanded' : ''}`}>
                    &nbsp;{s_text}
                </span>
            </div> : <div
                className={` button-container flex items-center  py-4 px-6 rounded-xl transition-all`}
            >
                <span className="button-text default-text text-[13px] opacity-60 dark:opacity-70">
                    {p_text}
                </span>

            </div>}

            <button className={`flex gap-1 items-center border border-gray-300 ${shouldShow ? "hover:bg-[#f3f5f7] hover:dark:bg-[#343647]" : "hover:bg-[#fefffe] hover:dark:bg-[#2c2d42]"}  bg-[#fefffe] dark:bg-[#2c2d42] py-1 px-2 backdrop-blur-2xl dark:border-[#444556] rounded-full text-[12px] shadow transition-all mt-4 ${showAdd}`} onClick={async () => {
                const path = await func();
                if (path !== "" && path !== undefined && path !== null) {
                    console.log(path);
                    setPath(path);
                }
                setShouldShow(false);

            }}
                onMouseEnter={() => setShouldShow(true)}>
                {icon}
                {path !== "" ? <div className="opacity-70 ">{path}</div> : <></>}
            </button>


        </div>
    )
}

export default Intro;