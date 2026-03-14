import { getLanguageFromPath } from "../editor-utils";

describe("editor-utils", () => {
    describe("getLanguageFromPath", () => {
        test("detects typescript", () => {
            expect(getLanguageFromPath("file.ts")).toBe("typescript");
            expect(getLanguageFromPath("component.tsx")).toBe("typescript");
        });

        test("detects javascript", () => {
            expect(getLanguageFromPath("file.js")).toBe("javascript");
            expect(getLanguageFromPath("app.jsx")).toBe("javascript");
        });

        test("detects json", () => {
            expect(getLanguageFromPath("config.json")).toBe("json");
        });

        test("detects markdown", () => {
            expect(getLanguageFromPath("README.md")).toBe("markdown");
            expect(getLanguageFromPath("notes.mdx")).toBe("markdown");
        });

        test("detects css", () => {
            expect(getLanguageFromPath("styles.css")).toBe("css");
            expect(getLanguageFromPath("main.scss")).toBe("css");
        });

        test("detects html", () => {
            expect(getLanguageFromPath("index.html")).toBe("html");
            expect(getLanguageFromPath("about.htm")).toBe("html");
        });

        test("detects python", () => {
            expect(getLanguageFromPath("script.py")).toBe("python");
        });

        test("detects go", () => {
            expect(getLanguageFromPath("main.go")).toBe("go");
        });

        test("detects rust", () => {
            expect(getLanguageFromPath("lib.rs")).toBe("rust");
        });

        test("detects java", () => {
            expect(getLanguageFromPath("App.java")).toBe("java");
        });

        test("detects cpp", () => {
            expect(getLanguageFromPath("main.cpp")).toBe("cpp");
            expect(getLanguageFromPath("header.h")).toBe("cpp");
            expect(getLanguageFromPath("header.hpp")).toBe("cpp");
            expect(getLanguageFromPath("source.c")).toBe("cpp");
        });

        test("detects shell", () => {
            expect(getLanguageFromPath("script.sh")).toBe("shell");
            expect(getLanguageFromPath("init.bash")).toBe("shell");
        });

        test("detects yaml", () => {
            expect(getLanguageFromPath("config.yml")).toBe("yaml");
            expect(getLanguageFromPath("config.yaml")).toBe("yaml");
        });

        test("detects sql", () => {
            expect(getLanguageFromPath("query.sql")).toBe("sql");
        });

        test("detects xml", () => {
            expect(getLanguageFromPath("data.xml")).toBe("xml");
        });

        test("detects php", () => {
            expect(getLanguageFromPath("index.php")).toBe("php");
        });

        test("detects dockerfile", () => {
            expect(getLanguageFromPath("Dockerfile")).toBe("dockerfile");
            expect(getLanguageFromPath("dockerfile.dev")).toBe("dockerfile");
        });

        test("defaults to plaintext for unknown extensions", () => {
            expect(getLanguageFromPath("file.unknown")).toBe("plaintext");
            expect(getLanguageFromPath("noextension")).toBe("plaintext");
        });
    });
});
