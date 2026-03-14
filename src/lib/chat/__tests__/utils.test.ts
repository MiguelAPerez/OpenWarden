import { extractMentionedPaths, parseDiffs } from "../utils";

describe("chat utils", () => {
    describe("extractMentionedPaths", () => {
        it("extracts simple @mentions", () => {
            const text = "Check @src/lib/utils.ts and @README.md";
            expect(extractMentionedPaths(text)).toEqual(["src/lib/utils.ts", "README.md"]);
        });

        it("ignores structured mentions like @[TerminalName: ...]", () => {
            const text = "Look at @[TerminalName: zsh, ProcessId: 123] and @file.ts";
            expect(extractMentionedPaths(text)).toEqual(["file.ts"]);
        });

        it("returns unique paths", () => {
            const text = "@file.ts and @file.ts";
            expect(extractMentionedPaths(text)).toEqual(["file.ts"]);
        });
    });

    describe("parseDiffs", () => {
        it("parses combined diff format with FILE marker", () => {
            const content = "FILE: file.ts\n```diff\n+++ b/file.ts\n+new line\n```";
            const { suggestion, cleanContent } = parseDiffs(content, null, {});
            expect(cleanContent).toBe("");
            expect(suggestion.filesChanged["file.ts"].suggestedContent).toBe("+++ b/file.ts\n+new line");
        });

        it("handles [INTERNAL_FILE_CHANGE_START] markers", () => {
            const content = "[INTERNAL_FILE_CHANGE_START: test.ts] \n```ts\nupdated content\n```\n [INTERNAL_FILE_CHANGE_END: test.ts]";
            const { suggestion } = parseDiffs(content, null, {});
            expect(suggestion.filesChanged["test.ts"].suggestedContent).toBe("updated content");
        });

        it("handles loose format markers (FILE: path)", () => {
            const content = "FILE: loose.ts\n```js\nloose content\n```";
            const { suggestion } = parseDiffs(content, null, {});
            expect(suggestion.filesChanged["loose.ts"].suggestedContent).toBe("loose content");
        });

        it("handles duplicate loose format markers by picking the longest", () => {
            const content = "FILE: loose.ts\n```js\nfirst\n```\nFILE: loose.ts\n```js\nsecond\n```";
            const { suggestion } = parseDiffs(content, null, {});
            expect(suggestion.filesChanged["loose.ts"].suggestedContent).toBe("second");
        });

        it("falls back to orphan code block for active file", () => {
            const content = "Just some code:\n```ts\norphan content\n```";
            const { suggestion } = parseDiffs(content, "active.ts", {});
            expect(suggestion.filesChanged["active.ts"].suggestedContent).toBe("orphan content");
        });

        it("cleans up various markers and headers", () => {
            const content = "FILE: test.ts\n```ts\ncontent\n```\nSome footer content";
            const { cleanContent } = parseDiffs(content, null, {});
            expect(cleanContent).not.toContain("FILE: test.ts");
            expect(cleanContent).toContain("Some footer content");
        });
    });
});
