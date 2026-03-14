import { useEffect, useRef } from "react";
import { Monaco } from "@monaco-editor/react";
import { diffLines } from "diff";
import { Tab } from "../WorkspaceClient";
import { PendingSuggestion } from "@/app/actions/chat";
import { DiffBlock } from "../components/RevertPrompt";

interface UseGitDiffDecorationsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editorRef: React.RefObject<any>;
    monacoRef: React.RefObject<Monaco | null>;
    activeTab: Tab | undefined;
    pendingSuggestion?: PendingSuggestion | null;
    editorMountCount: number;
}

export function useGitDiffDecorations({
    editorRef,
    monacoRef,
    activeTab,
    pendingSuggestion,
    editorMountCount
}: UseGitDiffDecorationsProps) {
    const decorationsRef = useRef<string[]>([]);
    const diffBlocksRef = useRef<DiffBlock[]>([]);

    useEffect(() => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (!editor || !monaco || !activeTab) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decorations: any[] = [];
        const newBlocks: DiffBlock[] = [];

        if (activeTab.gitIndexContent !== null) {
            const diffs = diffLines(activeTab.gitIndexContent, activeTab.content || "");
            let currentLine = 1;

            for (let i = 0; i < diffs.length; i++) {
                const part = diffs[i];

                if (part.removed) {
                    if (i + 1 < diffs.length && diffs[i + 1].added) {
                        const addedPart = diffs[i + 1];
                        const start = currentLine;
                        const end = currentLine + addedPart.count! - 1;

                        newBlocks.push({ type: 'modified', currStart: start, currEnd: end, origValue: part.value });

                        decorations.push({
                            range: new monaco.Range(start, 1, end, 1),
                            options: {
                                isWholeLine: false,
                                linesDecorationsClassName: "git-diff-modified cursor-pointer hover:opacity-80",
                                marginClassName: "git-diff-modified-margin cursor-pointer hover:opacity-80"
                            }
                        });
                        currentLine += addedPart.count!;
                        i++; // skip next added part
                    } else {
                        const lineToMark = Math.max(1, currentLine - 1);
                        newBlocks.push({ type: 'removed', currStart: lineToMark, currEnd: lineToMark, origValue: part.value });

                        decorations.push({
                            range: new monaco.Range(lineToMark, 1, lineToMark, 1),
                            options: {
                                isWholeLine: false,
                                linesDecorationsClassName: "git-diff-removed cursor-pointer hover:opacity-80",
                                marginClassName: "git-diff-removed-margin cursor-pointer hover:opacity-80"
                            }
                        });
                    }
                } else if (part.added) {
                    const start = currentLine;
                    const end = currentLine + part.count! - 1;

                    newBlocks.push({ type: 'added', currStart: start, currEnd: end, origValue: '' });

                    decorations.push({
                        range: new monaco.Range(start, 1, end, 1),
                        options: {
                            isWholeLine: false,
                            linesDecorationsClassName: "git-diff-added cursor-pointer hover:opacity-80",
                            marginClassName: "git-diff-added-margin cursor-pointer hover:opacity-80"
                        }
                    });
                    currentLine += part.count!;
                } else {
                    currentLine += part.count!;
                }
            }
        }

        if (pendingSuggestion && pendingSuggestion.filesChanged[activeTab.path]) {
            const fileChange = pendingSuggestion.filesChanged[activeTab.path];
            const diffs = diffLines(fileChange.originalContent, fileChange.suggestedContent);
            let currentLine = 1;
            for (let i = 0; i < diffs.length; i++) {
                const part = diffs[i];
                if (part.added) {
                    const start = currentLine;
                    const end = currentLine + part.count! - 1;
                    
                    decorations.push({
                        range: new monaco.Range(start, 1, end, 1),
                        options: {
                            isWholeLine: true,
                            className: "pending-suggestion-line",
                            marginClassName: "pending-suggestion-margin"
                        }
                    });
                    currentLine += part.count!;
                } else if (!part.removed) {
                    currentLine += part.count!;
                }
            }
        }

        diffBlocksRef.current = newBlocks;
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);

    }, [editorRef, monacoRef, activeTab, pendingSuggestion, editorMountCount]);

    return { diffBlocksRef };
}
