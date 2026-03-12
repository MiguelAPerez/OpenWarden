import { analyzeRepoDocs } from "./src/lib/analysis";
import { db } from "./db";
import { repositories } from "./db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Forcing re-analysis by resetting hashes...");
    const allRepos = db.select().from(repositories).all();
    for (const repo of allRepos) {
        db.update(repositories).set({ lastAnalyzedHash: "reset" }).where(eq(repositories.id, repo.id)).run();
    }
    
    console.log("Starting manual repo analysis...");
    await analyzeRepoDocs();
    console.log("Manual repo analysis complete.");
}

main().catch(console.error);
