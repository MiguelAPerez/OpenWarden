import { renderHook } from "@testing-library/react";
import { useProcessedBenchmarkData } from "../useProcessedBenchmarkData";
import { Benchmark, BenchmarkEntry } from "@/types/agent";

const mockBenchmark: Benchmark = {
    id: "bench-1",
    userId: "user-1",
    runId: "run-1",
    name: "Standard Run",
    status: "completed",
    totalEntries: 2,
    completedEntries: 2,
};

const mockEntries: BenchmarkEntry[] = [
    {
        id: "entry-1",
        benchmarkId: "bench-1",
        model: "gpt-4",
        contextGroupId: "cg-1",
        systemPromptId: null,
        category: "Logic",
        score: 100,
        metrics: JSON.stringify({ variationName: "Persona A", responseSize: 500, expectationResults: [{ found: true }, { found: true }] }),
        prompt: "...",
        systemContext: "...",
        status: "completed",
        output: "...",
        error: null,
        duration: 1000,
        startedAt: new Date(),
        completedAt: new Date(),
    },
    {
        id: "entry-2",
        benchmarkId: "bench-1",
        model: "claude-3",
        contextGroupId: "cg-1",
        systemPromptId: null,
        category: "Coding",
        score: 80,
        metrics: JSON.stringify({ variationName: "Persona A", responseSize: 400, expectationResults: [{ found: true }, { found: false }] }),
        prompt: "...",
        systemContext: "...",
        status: "completed",
        output: "...",
        error: null,
        duration: 1200,
        startedAt: new Date(),
        completedAt: new Date(),
    }
];

describe("useProcessedBenchmarkData", () => {
    test("processes data for models view", () => {
        const data = [{ ...mockBenchmark, entries: mockEntries }];
        const { result } = renderHook(() => useProcessedBenchmarkData(data, "models"));

        expect(result.current).toHaveLength(2);
        
        const gpt4 = result.current.find(s => s.id === "gpt-4");
        expect(gpt4).toBeDefined();
        expect(gpt4?.avgScore).toBe(100);
        expect(gpt4?.avgDuration).toBe(1000);
        expect(gpt4?.avgResponseSize).toBe(500);
        expect(gpt4?.totalExpMet).toBe(2);
        expect(gpt4?.totalExpChecked).toBe(2);
        expect(gpt4?.details).toHaveLength(1);
        expect(gpt4?.details[0].label).toBe("Logic");

        const claude3 = result.current.find(s => s.id === "claude-3");
        expect(claude3).toBeDefined();
        expect(claude3?.avgScore).toBe(80);
        expect(claude3?.avgDuration).toBe(1200);
        expect(claude3?.avgResponseSize).toBe(400);
        expect(claude3?.totalExpMet).toBe(1);
        expect(claude3?.totalExpChecked).toBe(2);
    });

    test("processes data for variations view", () => {
        const data = [{ ...mockBenchmark, entries: mockEntries }];
        const { result } = renderHook(() => useProcessedBenchmarkData(data, "variations"));

        // Both entries have "Persona A" variation
        expect(result.current).toHaveLength(1);
        
        const personaA = result.current[0];
        expect(personaA.id).toBe("Persona A");
        expect(personaA.avgScore).toBe(90); // (100 + 80) / 2
        expect(personaA.avgDuration).toBe(1100); // (1000 + 1200) / 2
        expect(personaA.totalExpMet).toBe(3); // 2 + 1
        expect(personaA.totalExpChecked).toBe(4); // 2 + 2
        expect(personaA.details).toHaveLength(2); // Logic and Coding categories
    });

    test("handles incomplete or failed entries", () => {
        const entriesWithFailures: BenchmarkEntry[] = [
            ...mockEntries,
            {
                ...mockEntries[0],
                id: "entry-3",
                status: "failed",
                score: null,
            }
        ];
        const data = [{ ...mockBenchmark, entries: entriesWithFailures }];
        const { result } = renderHook(() => useProcessedBenchmarkData(data, "models"));

        // Result should still only have 2 models and not include the failed entry in averages
        expect(result.current).toHaveLength(2);
    });

    test("sorts results by average score descending", () => {
        const data = [{ ...mockBenchmark, entries: mockEntries }];
        const { result } = renderHook(() => useProcessedBenchmarkData(data, "models"));

        expect(result.current[0].id).toBe("gpt-4"); // 100
        expect(result.current[1].id).toBe("claude-3"); // 80
    });
});
