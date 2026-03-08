import { db } from "@/../db";
import { repositories, giteaConfigurations } from "@/../db/schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const REPOS_BASE_DIR = path.join(process.cwd(), "data", "repos");

export async function analyzeRepoDocs(filter?: (repo: unknown) => boolean) {
    console.log("Starting repository analysis...");

    try {
        let allRepos = db.select().from(repositories).all();

        // Filter for repos with "docs" or "documentation" topics
        allRepos = allRepos.filter(repo => {
            const topics = repo.topics ? JSON.parse(repo.topics) : [];
            return topics.some((t: string) => t === "docs" || t === "documentation");
        });

        if (filter) {
            allRepos = allRepos.filter(filter);
        }
        console.log(`Found ${allRepos.length} repositories to analyze.`);

        for (const repo of allRepos) {
            console.log(`Analyzing ${repo.fullName}...`);
            try {
                let cloneUrl = repo.url;
                if (repo.source === "gitea") {
                    const config = db.select().from(giteaConfigurations).where(eq(giteaConfigurations.userId, repo.userId)).get();
                    if (config) {
                        try {
                            const urlObj = new URL(repo.url);
                            urlObj.username = config.token;
                            cloneUrl = urlObj.toString();
                        } catch {
                            console.error(`Failed to parse repo URL for ${repo.fullName}`);
                        }
                    }
                }

                await fs.mkdir(REPOS_BASE_DIR, { recursive: true });
                const repoDir = path.join(REPOS_BASE_DIR, repo.fullName);

                let isCloned = false;
                try {
                    await fs.access(repoDir);
                    console.log(`Pulling updates for ${repo.fullName}...`);
                    await execAsync(`git -C "${repoDir}" pull`);
                    isCloned = true;
                } catch {
                    const repoParentDir = path.dirname(repoDir);
                    await fs.mkdir(repoParentDir, { recursive: true });
                    try {
                        console.log(`Cloning ${repo.fullName}...`);
                        await execAsync(`git clone "${cloneUrl}.git" "${repoDir}"`);
                        isCloned = true;
                    } catch (e) {
                        console.error(`Failed to clone ${repo.fullName}`, e);
                    }
                }

                if (!isCloned) continue;

                let currentHash = "none";
                try {
                    const { stdout: hashStdout } = await execAsync(`git -C "${repoDir}" rev-parse HEAD`);
                    currentHash = hashStdout.trim();
                } catch {
                    console.warn(`Could not get HEAD hash for repo: ${repo.fullName}, it might be empty.`);
                }

                if (currentHash !== "none" && currentHash === repo.lastAnalyzedHash) {
                    console.log(`Skipping ${repo.fullName} (hash matches).`);
                    continue;
                }

                // Metadata extraction: Count markdown files
                let mdCount = 0;
                async function countMd(dir: string) {
                    try {
                        const files = await fs.readdir(dir, { withFileTypes: true });
                        for (const file of files) {
                            if (file.isDirectory() && file.name !== ".git" && file.name !== "node_modules") {
                                await countMd(path.join(dir, file.name));
                            } else if (file.name.endsWith(".md") || file.name.endsWith(".mdx")) {
                                mdCount++;
                            }
                        }
                    } catch {
                        // ignore access issues in subdirectories
                    }
                }

                await countMd(repoDir);
                const metadata = {
                    markdown_file_count: mdCount,
                };
                console.log(`Extracted metadata for ${repo.fullName}: ${JSON.stringify(metadata)}`);

                // Update main repo record with hash, metadata and timestamps
                await db.update(repositories)
                    .set({
                        lastAnalyzedHash: currentHash,
                        metadata: JSON.stringify(metadata),
                        analyzedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(eq(repositories.id, repo.id));

                console.log(`Successfully updated analysis for ${repo.fullName}.`);
            } catch (err) {
                console.error(`Error analyzing repo ${repo.fullName}:`, err);
            }
        }

        console.log("Repository analysis complete.");
    } catch (error) {
        console.error("Fatal error during repository analysis:", error);
    }
}
