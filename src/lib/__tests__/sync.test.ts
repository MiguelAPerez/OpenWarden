import { syncRepositories } from "../sync";
import { db } from "@/../db";
import fs from "fs/promises";
import { exec } from "child_process";
import { getAuthenticatedCloneUrl } from "../git-auth";

// Mocking dependencies
jest.mock("@/../db", () => ({
    db: {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        all: jest.fn(),
    } as unknown,
}));

jest.mock("fs/promises", () => ({
    mkdir: jest.fn(),
    access: jest.fn(),
}));

jest.mock("child_process", () => ({
    exec: jest.fn(),
}));

jest.mock("util", () => ({
    promisify: (fn: any) => fn, // eslint-disable-line @typescript-eslint/no-explicit-any
}));

jest.mock("../git-auth", () => ({
    getAuthenticatedCloneUrl: jest.fn(),
}));

describe("sync", () => {
    const mockDb = db as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const mockExec = exec as unknown as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => { });
        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should pull repository if it exists", async () => {
        const mockRepos = [
            { id: "r1", fullName: "user/repo", enabled: true, userId: "u1", url: "http://git.com/r1" },
        ];
        mockDb.all.mockReturnValue(mockRepos);
        (getAuthenticatedCloneUrl as jest.Mock).mockResolvedValue("http://token@git.com/r1");
        (fs.access as jest.Mock).mockResolvedValue(undefined);
        mockExec.mockResolvedValue({ stdout: "pull success", stderr: "" });

        const result = await syncRepositories();

        expect(result).toEqual({ success: true });
        expect(mockExec).toHaveBeenCalledWith(expect.stringContaining("git -C"));
        expect(mockExec).toHaveBeenCalledWith(expect.stringContaining("pull"));
    });

    it("should clone repository if it does not exist", async () => {
        const mockRepos = [
            { id: "r1", fullName: "user/repo", enabled: true, userId: "u1", url: "http://git.com/r1" },
        ];
        mockDb.all.mockReturnValue(mockRepos);
        (getAuthenticatedCloneUrl as jest.Mock).mockResolvedValue("http://token@git.com/r1");
        (fs.access as jest.Mock).mockRejectedValue(new Error("no dir"));
        mockExec.mockResolvedValue({ stdout: "clone success", stderr: "" });

        await syncRepositories();

        expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
        expect(mockExec).toHaveBeenCalledWith(expect.stringContaining("git clone"));
        expect(mockExec).toHaveBeenCalledWith(expect.stringContaining("http://token@git.com/r1.git"));
    });

    it("should filter repositories by IDs", async () => {
        const mockRepos = [
            { id: "r1", fullName: "user/repo1", enabled: true, userId: "u1" },
            { id: "r2", fullName: "user/repo2", enabled: true, userId: "u1" },
        ];
        mockDb.all.mockReturnValue(mockRepos);
        (fs.access as jest.Mock).mockResolvedValue(undefined);

        await syncRepositories(["r1"]);

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Syncing user/repo1..."));
        expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining("Syncing user/repo2..."));
    });

    it("should throw error on fatal failure", async () => {
        mockDb.all.mockImplementation(() => { throw new Error("db error"); });

        await expect(syncRepositories()).rejects.toThrow("db error");
        expect(console.error).toHaveBeenCalled();
    });
});
