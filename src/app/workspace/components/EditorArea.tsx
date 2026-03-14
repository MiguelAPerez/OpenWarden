import React, { useEffect, useRef, useState } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { Tab } from "../WorkspaceClient";
import RevertPrompt, { DiffBlock } from "./RevertPrompt";
import { PendingSuggestion } from "@/app/actions/chat";
import { getLanguageFromPath } from "@/lib/editor-utils";
import { useGitDiffDecorations } from "../hooks/useGitDiffDecorations";
import { EditorTabs } from "./EditorTabs";

interface EditorAreaProps {
    tabs: Tab[];
    activeTabPath: string | null;
    onTabSelect: (path: string) => void;
    onTabClose: (path: string) => void;
    onContentChange: (path: string, content: string) => void;
    onSaveFile: (path: string) => void;
    pendingSuggestion?: PendingSuggestion | null;
}

export default function EditorArea({
    tabs,
    activeTabPath,
    onTabSelect,
    onTabClose,
    onContentChange,
    onSaveFile,
    pendingSuggestion
}: EditorAreaProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<Monaco | null>(null);

    const [editorMountCount, setEditorMountCount] = useState(0);
    const [revertPrompt, setRevertPrompt] = useState<DiffBlock | null>(null);

    const activeTab = tabs.find(t => t.path === activeTabPath);

    // Setup decorations via hook
    const { diffBlocksRef } = useGitDiffDecorations({
        editorRef,
        monacoRef,
        activeTab,
        pendingSuggestion,
        editorMountCount
    });

    // Setup global keyboard shortcut for Save and Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                if (activeTabPath) onSaveFile(activeTabPath);
            }
            if (e.key === "Escape" && revertPrompt) {
                setRevertPrompt(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeTabPath, onSaveFile, revertPrompt]);

    if (tabs.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-foreground/30 bg-background">
                <div className="text-center">
                    <p className="text-xl mb-2">Editor</p>
                    <p className="text-sm">Select a file from the explorer to open it.</p>
                </div>
            </div>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const revertBlock = (editor: any, block: DiffBlock) => {
        const model = editor.getModel();
        if (!model || !monacoRef.current) return;

        let range;
        let text = block.origValue;

        if (block.type === 'removed') {
            const maxCol = model.getLineMaxColumn(block.currEnd);
            range = new monacoRef.current.Range(block.currEnd, maxCol, block.currEnd, maxCol);
            text = '\n' + text.replace(/\n$/, '');
        } else if (block.type === 'added') {
            if (block.currStart > 1) {
                const prevMax = model.getLineMaxColumn(block.currStart - 1);
                const maxCol = model.getLineMaxColumn(block.currEnd);
                range = new monacoRef.current.Range(block.currStart - 1, prevMax, block.currEnd, maxCol);
            } else {
                const lineCount = model.getLineCount();
                if (block.currEnd < lineCount) {
                    range = new monacoRef.current.Range(block.currStart, 1, block.currEnd + 1, 1);
                } else {
                    const maxCol = model.getLineMaxColumn(block.currEnd);
                    range = new monacoRef.current.Range(block.currStart, 1, block.currEnd, maxCol);
                }
            }
            text = "";
        } else {
            const maxCol = model.getLineMaxColumn(block.currEnd);
            range = new monacoRef.current.Range(block.currStart, 1, block.currEnd, maxCol);
            text = text.replace(/\n$/, '');
        }

        editor.executeEdits('revert-git-change', [{
            range: range,
            text: text,
            forceMoveMarkers: true
        }]);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEditorMount = (editor: any, monaco: Monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        setEditorMountCount(c => c + 1);

        // Add Save shortcut
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            if (activeTabPath) onSaveFile(activeTabPath);
        });

        editor.addAction({
            id: 'revert-git-change',
            label: 'Revert Git Change',
            contextMenuGroupId: 'navigation',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            run: (ed: any) => {
                const pos = ed.getPosition();
                if (!pos) return;
                const block = diffBlocksRef.current.find(b => pos.lineNumber >= b.currStart && pos.lineNumber <= b.currEnd);
                if (block) setRevertPrompt(block);
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        editor.onMouseDown((e: any) => {
            if (e.target.type === 2 || e.target.type === 3 || e.target.type === 4 || e.target.type === 6) {
                const pos = e.target.position;
                if (!pos) return;
                const block = diffBlocksRef.current.find(b => pos.lineNumber >= b.currStart && pos.lineNumber <= b.currEnd);
                if (block) {
                    setRevertPrompt(block);
                }
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] overflow-hidden">
            <style>{`
                .git-diff-added-margin {
                    border-left: 3px solid #2ea043;
                    margin-left: 5px;
                }
                .git-diff-removed-margin {
                    border-left: 3px solid #f85149;
                    margin-left: 5px;
                }
                .git-diff-modified-margin {
                    border-left: 3px solid #f59e0b;
                    margin-left: 5px;
                }
                .pending-suggestion-line {
                    background-color: rgba(59, 130, 246, 0.15);
                }
                .pending-suggestion-margin {
                    border-left: 3px solid #3b82f6;
                    margin-left: 5px;
                }
            `}</style>
            
            <EditorTabs 
                tabs={tabs}
                activeTabPath={activeTabPath}
                onTabSelect={onTabSelect}
                onTabClose={onTabClose}
            />

            {/* Monaco Editor */}
            <div className="flex-1 relative">
                {activeTab ? (
                    <Editor
                        key={activeTab.path} 
                        path={activeTab.path}
                        language={getLanguageFromPath(activeTab.path)}
                        value={activeTab.content}
                        theme="vs-dark"
                        onChange={(val) => onContentChange(activeTab.path, val || "")}
                        beforeMount={(monaco) => {
                            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                                noSemanticValidation: true,
                                noSyntaxValidation: false,
                            });
                            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                                noSemanticValidation: true,
                                noSyntaxValidation: false,
                            });
                        }}
                        onMount={handleEditorMount}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            wordWrap: "on",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 16 }
                        }}
                    />
                ) : null}

                {/* Revert Confirmation Popup */}
                <RevertPrompt 
                    prompt={revertPrompt} 
                    onCancel={() => setRevertPrompt(null)} 
                    onConfirm={(block) => {
                        if (editorRef.current) {
                            revertBlock(editorRef.current, block);
                        }
                        setRevertPrompt(null);
                    }} 
                />
            </div>
        </div>
    );
}
