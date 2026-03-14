import fs from "fs/promises";
import path from "path";

const DATA_BASE_DIR = path.join(process.cwd(), "data");
const SYSTEM_STATICS_DIR = path.join(process.cwd(), "system-statics");

export async function ensureUserScaffold(userId: string) {
    const userDir = path.join(DATA_BASE_DIR, userId);
    const subDirs = ["agents", "skills", "workspaces", "repos"];

    for (const dir of subDirs) {
        const fullPath = path.join(userDir, dir);
        await fs.mkdir(fullPath, { recursive: true });
    }

    // Sync default prompts to data/system (Global) if not already there
    // (This was already seeded but let's make it robust)
    const systemDir = path.join(DATA_BASE_DIR, "system");
    await fs.mkdir(systemDir, { recursive: true });
    
    const masterPrompts = path.join(SYSTEM_STATICS_DIR, "system-prompts");
    try {
        const files = await fs.readdir(masterPrompts);
        for (const file of files) {
            const dest = path.join(systemDir, file);
            try {
                await fs.access(dest);
            } catch {
                await fs.copyFile(path.join(masterPrompts, file), dest);
            }
        }
    } catch (e) {
        console.warn("Failed to sync system prompts from statics", e);
    }
}
