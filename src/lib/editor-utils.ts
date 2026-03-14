/**
 * Detects the Monaco language for a given file path based on its extension.
 */
export const getLanguageFromPath = (path: string): string => {
    const ext = path.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "ts":
        case "tsx":
            return "typescript";
        case "js":
        case "jsx":
            return "javascript";
        case "json":
            return "json";
        case "md":
        case "mdx":
            return "markdown";
        case "css":
        case "scss":
            return "css";
        case "html":
        case "htm":
            return "html";
        case "py":
            return "python";
        case "go":
            return "go";
        case "rs":
            return "rust";
        case "java":
            return "java";
        case "c":
        case "cpp":
        case "h":
        case "hpp":
            return "cpp";
        case "sh":
        case "bash":
            return "shell";
        case "yml":
        case "yaml":
            return "yaml";
        case "sql":
            return "sql";
        case "xml":
            return "xml";
        case "php":
            return "php";
        default:
            if (path.toLowerCase().includes("dockerfile")) return "dockerfile";
            return "plaintext";
    }
};
