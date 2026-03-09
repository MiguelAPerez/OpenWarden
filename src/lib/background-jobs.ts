import { db } from "@/../db";
import { backgroundJobs } from "@/../db/schema";
import { eq } from "drizzle-orm";

export async function runBackgroundJob(name: string, task: () => Promise<unknown>) {
    const jobId = crypto.randomUUID();
    const startTime = new Date();
    
    db.insert(backgroundJobs).values({
        id: jobId,
        name: name,
        status: "running",
        startedAt: startTime,
    }).run();

    try {
        const result = await task();
        
        db.update(backgroundJobs).set({
            status: "completed",
            completedAt: new Date(),
            details: typeof result === 'object' ? JSON.stringify(result) : String(result || "Task completed successfully")
        }).where(eq(backgroundJobs.id, jobId)).run();
        
        return result;
    } catch (err) {
        console.error(`Background job ${name} failed:`, err);
        db.update(backgroundJobs).set({
            status: "failed",
            completedAt: new Date(),
            error: err instanceof Error ? err.message : String(err)
        }).where(eq(backgroundJobs.id, jobId)).run();
        throw err;
    }
}
