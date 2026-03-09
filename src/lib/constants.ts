import path from "path";

export const BLOCKLIST = [
    ".agent",
    "AGENT.md",
    ".git",
    "node_modules",
    ".next",
    "dist",
    "build",
    ".DS_Store",
    "package-lock.json",
    "yarn.lock"
];

export const ALLOWLIST = [".md", ".mdx"];

/**
 * Returns true if a path should be blocked based on the BLOCKLIST.
 * It checks if any segment of the relative path is in the blocklist.
 */
export function isPathBlocked(relPath: string): boolean {
    const segments = relPath.split(path.sep);
    return segments.some(segment => BLOCKLIST.includes(segment));
}
