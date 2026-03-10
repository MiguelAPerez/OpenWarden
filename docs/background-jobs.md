# Background Jobs & Cron Tasks

This project uses `node-cron` for scheduling background tasks. The configuration is centralized to ensure consistency across the application.

## How Background Jobs Work

1. **Definitions**: All cron tasks are defined in `src/lib/cron-constants.ts`. This file contains the schedule, display name, and description.
2. **Registration**: Jobs are registered in `src/instrumentation.ts`. This file runs on application startup and starts the `node-cron` scheduler.
3. **Monitoring**: The Admin Jobs UI (`/admin/jobs`) uses the centralized definitions to display the status and execution history of each job.

## How to Add a New Cron Job

To add a new scheduled task, follow these steps:

### 1. Define the Job Metadata

Add a new entry to the `CRON_DEFINITIONS` constant in `src/lib/cron-constants.ts`:

```typescript
export const CRON_DEFINITIONS = [
    // ... existing jobs
    {
        id: "my_new_job",
        name: "My New Task",
        schedule: "0 * * * *", // Standard cron syntax (every hour)
        displaySchedule: "Every hour",
        description: "A description of what this job does."
    },
] as const;
```

### 2. Implement the Job Logic

Create your job logic in a dedicated library file (e.g., `src/lib/my-task.ts`).

### 3. Register the Job

Update the `jobs` mapping in `src/instrumentation.ts`:

```typescript
// inside register() function
const { myNewTask } = require("./lib/my-task");

const jobs: Record<string, () => Promise<unknown>> = {
    repository_sync: syncRepositories,
    repository_analysis_docs: analyzeRepoDocs,
    semantic_indexing: semanticIndexing,
    my_new_job: myNewTask, // Add your mapping here
};
```

### 4. Trigger Manually (Optional)

If you want to allow manual triggering from the UI or an action, add a server action in `src/app/actions/config.ts`:

```typescript
export async function triggerMyNewJob() {
    const { myNewTask } = require("@/lib/my-task");
    const { runBackgroundJob } = require("@/lib/background-jobs");
    
    runBackgroundJob("my_new_job", async () => {
        await myNewTask();
        return "Manual execution complete";
    }).catch(console.error);
    
    revalidatePath("/admin/jobs");
    return { success: true };
}
```

Then update `handleRunNow` in `src/app/admin/jobs/page.tsx` to call your new action.
