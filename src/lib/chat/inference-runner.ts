import { ChatMessage, ChatResponse, ContextData, ChatClient, WorkMode, Usage } from "./types";
import { PromptBuilder } from "./prompt-builder";
import { getRepoFileContentInternal } from "@/lib/repo-utils";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { executeSkill } from "../skills/execution-engine";

const tracer = trace.getTracer("inference-runner");

/**
 * This class is used to run the inference with the agent.
 * It will recursively call the agent until it gets a response with no conflicts
 */
export class InferenceRunner {
    constructor(
        private readonly userId: string,
        private readonly repoId: string,
        private readonly contextData: ContextData,
        private readonly chatClient: ChatClient
    ) { }

    async run(prompt: string, initialFilePath: string | null, initialFileContent: string, sysPrompt: string, workMode: WorkMode): Promise<ChatResponse> {
        return tracer.startActiveSpan("inference_runner.run", async (span) => {
            try {
                span.setAttributes({
                    "work_mode": workMode,
                    "prompt.length": prompt.length,
                    "agent.id": this.contextData.agentConfig.id
                });

                const messages: ChatMessage[] = [
                    { role: "system", content: "" },
                    { role: "user", content: prompt }
                ];

                let currentFilePath = initialFilePath;
                let currentFileContent = initialFileContent;
                let currentRedirect = initialFilePath;
                
                const maxSteps = workMode === "DOCUMENTATION" ? 3 : 2;
                const totalUsage: Usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

                for (let step = 0; step < maxSteps; step++) {
                    const stepSpan = tracer.startSpan(`inference_runner.step_${step + 1}`);
                    try {
                        const systemPrompt = await PromptBuilder.buildSystemPrompt(this.contextData, currentFilePath, currentFileContent, workMode, sysPrompt);
                        messages[0].content = systemPrompt;

                        const inferenceStart = Date.now();
                        const { content, usage } = await this.chatClient.chat(messages);
                        const inferenceTime = Date.now() - inferenceStart;

                        if (usage) {
                            totalUsage.promptTokens += usage.promptTokens;
                            totalUsage.completionTokens += usage.completionTokens;
                            totalUsage.totalTokens += usage.totalTokens;
                        }

                        // Record usage stats
                        if (this.contextData.agentConfig.id) {
                            try {
                                const { recordAgentUsage } = await import("@/app/actions/performance");
                                await recordAgentUsage(this.contextData.agentConfig.id, usage?.promptTokens || 0, usage?.completionTokens || 0, inferenceTime);
                            } catch (e) { /* ignore */ }
                        }

                        const jsonMatch = content.match(/\{[\s\S]*\}/);
                        let parsed = null;
                        if (jsonMatch) {
                            try { parsed = JSON.parse(jsonMatch[0]); } catch { /* ignore */ }
                        }

                        if (parsed && step < maxSteps - 1) {
                            // 1. Handle Navigation
                            if (parsed.redirect) {
                                const newPath = parsed.redirect;
                                if (newPath !== currentFilePath) {
                                    try {
                                        const newContent = await getRepoFileContentInternal(this.repoId, newPath, this.userId);
                                        const cleanedContent = newContent.replace(/^---\s*[\s\S]*?---\s*/, '');

                                        messages.push({ role: "assistant", content });
                                        messages.push({
                                            role: "user",
                                            content: `Observation: You are now seeing the FULL content of "${newPath}".\n\nContent:\n${cleanedContent}\n\nPlease provide your final answer based on this new information.`
                                        });

                                        currentFilePath = newPath;
                                        currentFileContent = cleanedContent;
                                        currentRedirect = newPath;
                                        continue;
                                    } catch (e) {
                                        console.error(`Failed to navigate to ${newPath}:`, e);
                                    }
                                }
                            }

                            // 2. Handle Skills
                            if (parsed.skill) {
                                const skill = this.contextData.enabledSkills?.find(s => s.id === parsed.skill);
                                if (skill) {
                                    const args = Array.isArray(parsed.args) ? parsed.args : [String(parsed.args || "")];
                                    try {
                                        const result = await executeSkill(skill, args, {
                                            REPO_IDS: JSON.stringify([this.repoId])
                                        });

                                        let observation = `Observation: Executed skill "${skill.id}" with args: ${args.join(", ")}.\n\n`;
                                        observation += `Exit Code: ${result.exitCode}\n`;
                                        if (result.stdout) observation += `Output:\n${result.stdout}\n`;
                                        if (result.stderr) observation += `Error Output:\n${result.stderr}\n`;

                                        messages.push({ role: "assistant", content });
                                        messages.push({ role: "user", content: observation + "\nPlease proceed based on this." });
                                        continue;
                                    } catch (e) {
                                        console.error(`Failed to execute skill ${skill.id}:`, e);
                                    }
                                }
                            }
                        }

                        return {
                            message: parsed?.message || content,
                            redirect: currentRedirect,
                            usage: totalUsage
                        };
                    } finally {
                        stepSpan.end();
                    }
                }

                return {
                    message: "Maximum inference steps reached.",
                    redirect: currentRedirect,
                    usage: totalUsage
                };
            } catch (error) {
                span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : "Runner error" });
                throw error;
            } finally {
                span.end();
            }
        });
    }
}
