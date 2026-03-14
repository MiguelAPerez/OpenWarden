import React from "react";
import { Tab } from "../WorkspaceClient";

interface EditorTabsProps {
    tabs: Tab[];
    activeTabPath: string | null;
    onTabSelect: (path: string) => void;
    onTabClose: (path: string) => void;
}

export function EditorTabs({ tabs, activeTabPath, onTabSelect, onTabClose }: EditorTabsProps) {
    return (
        <div className="flex overflow-x-auto bg-[#252526] scrollbar-hide border-b border-[#3c3c3c] flex-shrink-0 relative z-10">
            {tabs.map(tab => {
                const isActive = tab.path === activeTabPath;
                const fileName = tab.path.split("/").pop() || tab.path;
                return (
                    <div
                        key={tab.path}
                        className={`group flex items-center gap-2 px-3 py-1.5 min-w-[100px] max-w-[200px] border-r border-[#3c3c3c] cursor-pointer text-sm
                            ${isActive ? "bg-[#1e1e1e] text-[#cccccc]" : "bg-[#2d2d2d] text-[#858585]"}
                            hover:bg-[#1e1e1e] transition-colors`}
                        onClick={() => onTabSelect(tab.path)}
                    >
                        <span className="truncate flex-1 select-none flex items-center gap-1.5" title={tab.path}>
                            {tab.isDirty && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>}
                            {fileName}
                        </span>
                        <button
                            className={`w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity text-[#cccccc]`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTabClose(tab.path);
                            }}
                        >
                            ×
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
