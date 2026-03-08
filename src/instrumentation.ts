
export function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const cron = require("node-cron");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { analyzeRepoDocs } = require("./lib/analysis");

        // every 30 min
        cron.schedule("*/30 * * * *", () => {
            analyzeRepoDocs();
        });

        console.log("Internal cron job registered: Repository analysis scheduled");
    }
}
