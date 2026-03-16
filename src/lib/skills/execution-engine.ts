import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { Skill } from "@/types/agent";
import { trace, SpanStatusCode } from "@opentelemetry/api";

const execAsync = promisify(exec);
const tracer = trace.getTracer("skills-execution-engine");

export interface SkillExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    duration: number;
    command: string;
}

export async function executeSkill(
    skill: Skill,
    args: string[] = [],
    env: Record<string, string> = {}
): Promise<SkillExecutionResult> {
    return tracer.startActiveSpan("skill.execute", async (span) => {
        const startTime = Date.now();
        span.setAttributes({
            "skill.id": skill.id,
            "skill.name": skill.name,
            "skill.runtime": skill.runtime,
            "skill.args": JSON.stringify(args),
            "skill.user_id": skill.userId,
            "skill.repo_ids": env.REPO_IDS
        });

        const skillPath = skill.isManaged
            ? path.join(process.cwd(), "data", "system", "skills", skill.id)
            : path.join(process.cwd(), "data", skill.userId, "skills", skill.id);

        if (!skill.scriptFile) {
            const error = new Error(`Skill ${skill.id} has no execution script.`);
            span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            span.end();
            throw error;
        }

        const scriptPathHost = path.join(skillPath, skill.scriptFile);
        const scriptPathContainer = path.join("/workspace", skill.scriptFile);

        let command = "";
        const escapedArgs = args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(" ");

        const getBaseCommand = (scriptPath: string) => {
            if (skill.scriptFile!.endsWith(".py")) {
                return `python3 "${scriptPath}" ${escapedArgs}`;
            } else if (skill.scriptFile!.endsWith(".ts") || skill.scriptFile!.endsWith(".js")) {
                const runner = skill.scriptFile!.endsWith(".ts") ? "npx tsx" : "node";
                return `${runner} "${scriptPath}" ${escapedArgs}`;
            } else if (skill.scriptFile!.endsWith(".php")) {
                return `php "${scriptPath}" ${escapedArgs}`;
            } else if (skill.scriptFile!.endsWith(".sh")) {
                return `bash "${scriptPath}" ${escapedArgs}`;
            }
            return null;
        };

        const localCommand = getBaseCommand(scriptPathHost);
        if (!localCommand) {
            const error = new Error(`Unsupported script type for skill ${skill.id}: ${skill.scriptFile}`);
            span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            span.end();
            throw error;
        }

        // Tunable timeout
        const timeoutMs = parseInt(process.env.SKILL_TIMEOUT || "30000"); // Default 30s
        span.setAttribute("skill.timeout", timeoutMs);

        try {
            const contextEnv: Record<string, string> = {
                ...process.env,
                ...env,
                USER_ID: (skill.userId && skill.userId !== 'system') ? skill.userId : (env.USER_ID || skill.userId),
                REPO_IDS: env.REPO_IDS || "[]",
            };

            if (skill.runtime === "docker") {
                const envFlags = Object.entries(contextEnv)
                    .filter(([, v]) => v !== undefined)
                    .map(([k, v]) => `-e ${k}="${String(v).replace(/"/g, '\\"')}"`)
                    .join(" ");

                // Map language to base image
                let image = "coding-agent-skill-base"; // Generic one or language specific
                if (skill.scriptFile!.endsWith(".py")) image = "python:3.10-slim";
                else if (skill.scriptFile!.endsWith(".js") || skill.scriptFile!.endsWith(".ts")) image = "node:18-slim";
                else if (skill.scriptFile!.endsWith(".php")) image = "php:8.2-cli";

                const containerCommand = getBaseCommand(scriptPathContainer);
                command = `docker run --rm -v "${skillPath}:/workspace" -w /workspace ${envFlags} ${image} sh -c '${containerCommand}'`;
            } else {


                // Local execution installs requirements on first run if needed
                if (skill.requirementsFile) {

                    // const depSpan = tracer.startSpan("skill.install_dependencies");
                    // try {
                    //     if (skill.requirementsFile === "env-requirements.txt") {
                    //         await execAsync(`pip install -r "${path.join(skillPath, skill.requirementsFile)}"`);
                    //     } else if (skill.requirementsFile === "package.json") {
                    //         await execAsync(`npm install --prefix "${skillPath}"`);
                    //     }
                    //     depSpan.end();
                    // } catch (depError) {
                    //     depSpan.setStatus({ code: SpanStatusCode.ERROR, message: String(depError) });
                    //     depSpan.end();
                    // }
                }
                command = localCommand;
            }

            const { stdout, stderr } = await execAsync(command, {
                env: skill.runtime === "docker" ? undefined : contextEnv as NodeJS.ProcessEnv,
                // Local skills run from the project root so node_modules and db paths resolve correctly.
                // Docker skills use skillPath since the volume mount handles the workspace.
                cwd: skill.runtime === "docker" ? skillPath : process.cwd(),
                timeout: timeoutMs,
            });

            const duration = Date.now() - startTime;
            span.setAttributes({
                "skill.duration": duration,
                "skill.exit_code": 0
            });

            return {
                stdout,
                stderr,
                exitCode: 0,
                duration,
                command
            };
        } catch (error: unknown) {
            const duration = Date.now() - startTime;
            const err = error as { stdout?: string; stderr?: string; message?: string; code?: number | string; signal?: string };

            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: err.message || String(error)
            });
            span.setAttributes({
                "skill.duration": duration,
                "skill.exit_code": typeof err.code === 'number' ? err.code : 1,
                "skill.timed_out": err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT'
            });

            return {
                stdout: err.stdout || "",
                stderr: err.stderr || err.message || String(error),
                exitCode: typeof err.code === 'number' ? err.code : 1,
                duration,
                command
            };
        } finally {
            span.end();
        }
    });
}
