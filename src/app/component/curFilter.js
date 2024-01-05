'use client';
import React, { createContext, useState, useContext } from 'react';

// 使用 createContext 创建新的 context
const FilterContext = createContext({
    curFilter: "",
    setCurFilter: () => { }
});

// 创建一个自定义 hook 以方便访问 context
export function useFilter() {
    return useContext(FilterContext);
}

// 创建一个 provider 组件
export function FilterProvider({ children }) {
    const [curFilter, setCurFilter] = useState("");

    // 提供 curFilter 和 setCurFilter 到 context
    return (
        <FilterContext.Provider value={{ curFilter, setCurFilter }}>
            {children}
        </FilterContext.Provider>
    );
}
