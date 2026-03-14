
import { parseDiffs } from "../utils";

describe("parseDiffs snippet handling", () => {
    it("should prefer the longest code block when multiple blocks are provided for the same file", () => {
        const content = 
            '### Update @.drone.yml\n' +
            'Here is a snippet:\n' +
            '```yaml\n' +
            'environment:\n' +
            '  AI_COPILOT_PORT: 3031\n' +
            '```\n\n' +
            '### Full .drone.yml\n' +
            'So, your .drone.yml should look like this:\n' +
            '```yaml\n' +
            'kind: pipeline\n' +
            'name: default\n' +
            'steps:\n' +
            '- name: container-update\n' +
            '  image: plugins/docker-compose\n' +
            '```\n';

        const result = parseDiffs(content, null, { ".drone.yml": "old" });
        expect(Object.keys(result.suggestion.filesChanged)).toContain(".drone.yml");
        const droneContent = result.suggestion.filesChanged[".drone.yml"].suggestedContent;
        expect(droneContent).toContain("kind: pipeline");
        expect(droneContent).not.toBe("environment:\n  AI_COPILOT_PORT: 3031");
    });
});
