import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { InferenceService } from "@/lib/chat/inference-service";

const tracer = trace.getTracer("api.chat.route");

/**
 * General Chat API Route
 * 
 * This route is used to handle general chat requests.
 */
export async function POST(req: NextRequest) {
    return tracer.startActiveSpan("POST", async (span) => {
        try {
            const session = await getServerSession(authOptions);
            if (!session?.user?.id) {
                span.setAttribute("error", "Unauthorized");
                span.setStatus({ code: SpanStatusCode.ERROR });
                span.end();
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { repoId, filePath, prompt, sysPrompt, agentId, history, workMode = "GENERAL" } = await req.json();
            const userId = session.user.id;

            if (!prompt || !agentId) {
                return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
            }

            span.setAttribute("repoId", repoId);
            span.setAttribute("agentId", agentId);
            span.setAttribute("filePath", filePath);
            span.setAttribute("workMode", workMode);

            const stream = await InferenceService.streamInference(
                userId,
                repoId,
                agentId,
                prompt,
                workMode,
                history,
                filePath,
                sysPrompt
            );

            return new Response(stream, {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "Transfer-Encoding": "chunked",
                },
            });
        } catch (error) {
            console.error("API Chat Error:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal Server Error" },
                { status: 500 }
            );
        } finally {
            span.end();
        }
    });
}
