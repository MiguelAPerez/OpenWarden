export function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const cron = require("node-cron");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { analyzeRepoDocs } = require("./lib/analysis");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { syncRepositories } = require("./lib/sync");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { semanticIndexing } = require("./lib/semanticIndexing");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { runBackgroundJob } = require("./lib/background-jobs");

        // every 15 min: Repository Sync (Cloning/Pulling)
        cron.schedule("*/15 * * * *", async () => {
            console.log("Starting scheduled repository sync...");
            await runBackgroundJob("repository_sync", async () => {
                await syncRepositories();
                return "Sync complete";
            });
        });

        // every 30 min: Repository Analysis (Docs)
        cron.schedule("*/30 * * * *", async () => {
            console.log("Starting scheduled repository analysis (docs)...");
            await runBackgroundJob("repository_analysis_docs", async () => {
                await analyzeRepoDocs();
                return "Analysis complete";
            });
        });

        // every 5 hours: Semantic Indexing
        cron.schedule("0 */5 * * *", async () => {
            console.log("Starting scheduled semantic indexing...");
            await semanticIndexing();
        });

        console.log("Internal cron jobs registered");
    }
}
