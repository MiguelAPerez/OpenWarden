/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from "@testing-library/react";
import { useGitDiffDecorations } from "../useGitDiffDecorations";
import { diffLines } from "diff";

// Mock diffLines
jest.mock("diff", () => ({
    diffLines: jest.fn(),
}));

describe("useGitDiffDecorations", () => {
    let mockEditor: any;
    let mockMonaco: any;

    beforeEach(() => {
        mockEditor = {
            deltaDecorations: jest.fn().mockReturnValue(["dec-1"]),
        };
        mockMonaco = {
            Range: class {
                constructor(public startLine: number, public startCol: number, public endLine: number, public endCol: number) {}
            },
        };
        (diffLines as jest.Mock).mockClear();
    });

    const activeTab = {
        path: "test.ts",
        name: "test.ts",
        content: "line 1\nline 2\nline 3",
        gitIndexContent: "line 1\nline 3",
        isDirty: true,
    } as any;

    test("applies git diff decorations", () => {
        (diffLines as jest.Mock).mockReturnValue([
            { value: "line 1\n", count: 1 },
            { value: "line 2\n", count: 1, added: true },
            { value: "line 3\n", count: 1 },
        ]);

        renderHook(() => useGitDiffDecorations({
            editorRef: { current: mockEditor },
            monacoRef: { current: mockMonaco },
            activeTab,
            editorMountCount: 1,
        }));

        expect(mockEditor.deltaDecorations).toHaveBeenCalled();
        const decorations = mockEditor.deltaDecorations.mock.calls[0][1];
        expect(decorations).toHaveLength(1);
        expect(decorations[0].options.linesDecorationsClassName).toContain("git-diff-added");
    });

    test("handles removed lines", () => {
        (diffLines as jest.Mock).mockReturnValue([
            { value: "line 1\n", count: 1 },
            { value: "line 2\n", count: 1, removed: true },
            { value: "line 3\n", count: 1 },
        ]);

        renderHook(() => useGitDiffDecorations({
            editorRef: { current: mockEditor },
            monacoRef: { current: mockMonaco },
            activeTab,
            editorMountCount: 1,
        }));

        const decorations = mockEditor.deltaDecorations.mock.calls[0][1];
        expect(decorations[0].options.linesDecorationsClassName).toContain("git-diff-removed");
    });

    test("handles modified lines (removed then added)", () => {
        (diffLines as jest.Mock).mockReturnValue([
            { value: "old line\n", count: 1, removed: true },
            { value: "new line\n", count: 1, added: true },
        ]);

        renderHook(() => useGitDiffDecorations({
            editorRef: { current: mockEditor },
            monacoRef: { current: mockMonaco },
            activeTab,
            editorMountCount: 1,
        }));

        const decorations = mockEditor.deltaDecorations.mock.calls[0][1];
        expect(decorations).toHaveLength(1);
        expect(decorations[0].options.linesDecorationsClassName).toContain("git-diff-modified");
    });

    test("applies pending suggestion decorations", () => {
        (diffLines as jest.Mock).mockReturnValue([
            { value: "original content\n", count: 1 },
            { value: "original content\n", count: 1 },
        ]);

        const pendingSuggestion = {
            id: "sugg-1",
            filesChanged: {
                "test.ts": {
                    originalContent: "original line",
                    suggestedContent: "suggested line",
                }
            }
        } as any;

        // Mock the second call to diffLines (for suggestions)
        (diffLines as jest.Mock)
            .mockReturnValueOnce([{ value: "...", count: 1 }]) // For git index
            .mockReturnValueOnce([{ value: "suggested line\n", count: 1, added: true }]); // For suggestion

        renderHook(() => useGitDiffDecorations({
            editorRef: { current: mockEditor },
            monacoRef: { current: mockMonaco },
            activeTab,
            pendingSuggestion,
            editorMountCount: 1,
        }));

        const decorations = mockEditor.deltaDecorations.mock.calls[0][1];
        const suggestionDec = decorations.find((d: any) => d.options.className === "pending-suggestion-line");
        expect(suggestionDec).toBeDefined();
    });
});
