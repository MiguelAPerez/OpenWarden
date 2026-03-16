import { semanticSearch } from "../../../src/app/actions/semantic-search";

async function main() {
    const query = process.argv[2];
    const limit = process.argv[3] ? parseInt(process.argv[3]) : 10;

    if (!query) {
        console.error("No query provided.");
        process.exit(1);
    }

    try {
        // We need repoIds. For a "system" skill in this context, 
        // we might want to pass them via env or args.
        // For now, let's assume it's for the "current" repo if provided.
        const repoIds = process.env.REPO_IDS ? JSON.parse(process.env.REPO_IDS) : [];
        
        if (repoIds.length === 0) {
            console.error("No repo IDs provided in REPO_IDS env var.");
            process.exit(1);
        }

        const results = await semanticSearch({
            repoIds,
            query,
            limit
        });

        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error("Search failed:", error);
        process.exit(1);
    }
}

main();
