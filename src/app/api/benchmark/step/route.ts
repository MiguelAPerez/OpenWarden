import { simulateBenchmarkStep } from "@/app/actions/benchmarks";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { benchmarkId } = body;
        
        if (!benchmarkId) {
            return NextResponse.json({ error: "Missing benchmarkId" }, { status: 400 });
        }
        
        const res = await simulateBenchmarkStep(benchmarkId);
        return NextResponse.json(res);
    } catch (error: unknown) {
        console.error("API Benchmark Step Error:", error);
        const msg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
