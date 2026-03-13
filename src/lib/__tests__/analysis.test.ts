import { analyzeRepoDocs } from "../analysis";
import { db } from "@/../db";
import { repositories } from "@/../db/schema";
import fs from "fs/promises";
import { exec } from "child_process";
import yaml from "js-yaml";
import { syncRepositories } from "../sync";
import { isPathBlocked } from "../constants";

// Mocking dependencies
jest.mock("@/../db", () => ({
    db: {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        all: jest.fn(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        run: jest.fn(),
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
}));

jest.mock("fs/promises", () => ({
    access: jest.fn(),
    readdir: jest.fn(),
    readFile: jest.fn(),
}));

jest.mock("child_process", () => ({
    exec: jest.fn(),
}));

jest.mock("util", () => ({
    promisify: (fn: any) => fn, // eslint-disable-line @typescript-eslint/no-explicit-any
}));

jest.mock("js-yaml", () => ({
    load: jest.fn(),
}));

jest.mock("../sync", () => ({
    syncRepositories: jest.fn(),
}));

jest.mock("../constants", () => ({
    isPathBlocked: jest.fn(() => false),
    ALLOWLIST: [".md"],
}));

describe("analysis", () => {
    const mockDb = db as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const mockExec = exec as unknown as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "warn").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should analyze repos with relevant topics", async () => {
        const mockRepos = [
            { id: "r1", fullName: "user/docs", topics: '["docs"]', enabled: true, userId: "u1" },
            { id: "r2", fullName: "user/code", topics: '["js"]', enabled: true, userId: "u1" },
        ];
        mockDb.all.mockReturnValue(mockRepos);
        
        // r1 path setup
        (fs.access as jest.Mock).mockResolvedValue(undefined);
        mockExec.mockResolvedValue({ stdout: "hash123\n" });
        (fs.readdir as jest.Mock).mockResolvedValue([
            { name: "README.md", isDirectory: () => false },
            { name: "src", isDirectory: () => true },
        ]);
        (fs.readdir as jest.Mock).mockResolvedValueOnce([
             { name: "README.md", isDirectory: () => false }
        ]);
        (fs.readFile as jest.Mock).mockResolvedValue("---\ntitle: Test\n---\nContent");
        (yaml.load as jest.Mock).mockReturnValue({ title: "Test Doc" });

        await analyzeRepoDocs();

        expect(mockDb.update).toHaveBeenCalledWith(repositories);
        expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
            lastAnalyzedHash: "hash123",
            docsMetadata: expect.stringContaining("Test Doc")
        }));
    });

    it("should filter by repoIds if provided", async () => {
        const mockRepos = [
            { id: "r1", fullName: "user/docs", topics: '["docs"]', enabled: true, userId: "u1" },
        ];
        mockDb.all.mockReturnValue(mockRepos);
        (fs.access as jest.Mock).mockRejectedValue(new Error("no dir"));
        (syncRepositories as jest.Mock).mockResolvedValue({ success: true });
        mockExec.mockResolvedValue({ stdout: "hash" });
        (fs.readdir as jest.Mock).mockResolvedValue([]);

        await analyzeRepoDocs(["r1"]);
        
        expect(syncRepositories).toHaveBeenCalledWith(["r1"]);
    });

    it("should skip if hash matches", async () => {
        const mockRepos = [
            { id: "r1", fullName: "user/docs", topics: '["docs"]', enabled: true, userId: "u1", lastAnalyzedHash: "hash123" },
        ];
        mockDb.all.mockReturnValue(mockRepos);
        (fs.access as jest.Mock).mockResolvedValue(undefined);
        mockExec.mockResolvedValue({ stdout: "hash123\n" });

        await analyzeRepoDocs();

        expect(mockDb.update).not.toHaveBeenCalled();
    });

    it("should handle empty or uninitialized repos", async () => {
        const mockRepos = [
            { id: "r1", fullName: "user/docs", topics: '["docs"]', enabled: true, userId: "u1" },
        ];
        mockDb.all.mockReturnValue(mockRepos);
        (fs.access as jest.Mock).mockResolvedValue(undefined);
        mockExec.mockRejectedValue(new Error("git error"));

        await analyzeRepoDocs();

        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("it might be empty"));
    });

    it("should catch and log errors during metadata extraction", async () => {
        const mockRepos = [
            { id: "r1", fullName: "user/docs", topics: '["docs"]', enabled: true, userId: "u1" },
        ];
        mockDb.all.mockReturnValue(mockRepos);
        (fs.access as jest.Mock).mockResolvedValue(undefined);
        mockExec.mockResolvedValue({ stdout: "hash" });
        (fs.readdir as jest.Mock).mockResolvedValue([{ name: "bad.md", isDirectory: () => false }]);
        (fs.readFile as jest.Mock).mockRejectedValue(new Error("read error"));

        await analyzeRepoDocs();
        
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Error parsing frontmatter"), expect.any(Error));
    });

    it("should handle error analyzing a specific repo and continue", async () => {
        const mockRepos = [
            { id: "r1", fullName: "user/fail", topics: '["docs"]', enabled: true, userId: "u1" },
            { id: "r2", fullName: "user/pass", topics: '["docs"]', enabled: true, userId: "u1" },
        ];
        mockDb.all.mockReturnValue(mockRepos);
        (fs.access as jest.Mock).mockRejectedValueOnce(new Error("inner loop error"));
        (syncRepositories as jest.Mock).mockRejectedValueOnce(new Error("inner loop error"));

        await analyzeRepoDocs();
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Error analyzing repo"), expect.any(Error));
    });

    it("should respect blocked paths and handle directories", async () => {
        const mockRepos = [{ id: "r1", fullName: "user/docs", topics: '["docs"]', enabled: true, userId: "u1" }];
        mockDb.all.mockReturnValue(mockRepos);
        (fs.access as jest.Mock).mockResolvedValue(undefined);
        mockExec.mockResolvedValue({ stdout: "hash" });
        
        (isPathBlocked as jest.Mock)
            .mockReturnValueOnce(true) // Blocked file
            .mockReturnValue(false);

        (fs.readdir as jest.Mock).mockResolvedValueOnce([
            { name: "blocked.md", isDirectory: () => false },
            { name: "dir", isDirectory: () => true },
        ]);
        (fs.readdir as jest.Mock).mockResolvedValueOnce([]); // Empty subdir

        await analyzeRepoDocs();
        expect(isPathBlocked).toHaveBeenCalled();
    });

    it("should handle fatal errors", async () => {
        mockDb.all.mockImplementation(() => { throw new Error("fatal"); });
        await analyzeRepoDocs();
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Fatal error"), expect.any(Error));
    });
});
