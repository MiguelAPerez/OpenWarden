
import { parseDiffs } from "../utils";

describe("parseDiffs specialized handling", () => {
    const fileContents = {
        "infrastructure/components/ai.yml": "name: homelab\nservices:\n  open-webui:\n    image: ghcr.io/open-webui/open-webui:0.8.8"
    };

    it("should resolve partial paths via suffix matching", () => {
        const content = 
            '### Update components/ai.yml\n' +
            '```yaml\n' +
            'name: homelab\n' +
            'services:\n' +
            '  open-webui:\n' +
            '    image: ghcr.io/open-webui/open-webui:0.8.8\n' +
            '  codewarden:\n' +
            '    image: ghcr.io/miguelaperez/coding-agent:latest\n' +
            '```\n';

        const result = parseDiffs(content, null, fileContents);
        expect(Object.keys(result.suggestion.filesChanged)).toContain("infrastructure/components/ai.yml");
    });

    it("should handle truncated blocks at the end of the content", () => {
        const content = 
            'FILE: infrastructure/components/ai.yml\n' +
            '```yaml\n' +
            'name: homelab\n' +
            'services:\n' +
            '  open-webui:\n' +
            '    image: ghcr.io/open-webui/open-webui:0.8.8';
        // Note: No trailing newline or backticks

        const result = parseDiffs(content, null, fileContents);
        expect(Object.keys(result.suggestion.filesChanged)).toContain("infrastructure/components/ai.yml");
        expect(result.suggestion.filesChanged["infrastructure/components/ai.yml"].suggestedContent).toContain("open-webui");
    });

    it("should prefer blocks with changes over blocks that match original content", () => {
        const content = 
            '### Proposed Change\n' +
            'FILE: infrastructure/components/ai.yml\n' +
            '```yaml\n' +
            'services:\n' +
            '  codewarden:\n' +
            '    image: ghcr.io/miguelaperez/coding-agent:latest\n' +
            '```\n\n' +
            '### Full File\n' +
            'FILE: infrastructure/components/ai.yml\n' +
            '```yaml\n' +
            'name: homelab\n' +
            'services:\n' +
            '  open-webui:\n' +
            '    image: ghcr.io/open-webui/open-webui:0.8.8\n' +
            '```\n';

        const result = parseDiffs(content, null, fileContents);
        const suggestion = result.suggestion.filesChanged["infrastructure/components/ai.yml"].suggestedContent;
        expect(suggestion).toContain("codewarden");
        expect(suggestion).not.toContain("name: homelab");
    });
});
