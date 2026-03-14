
import { parseDiffs } from "../utils";

describe("parseDiffs fallback (reproduction)", () => {
    it("should correctly parse paths from headings (### Update path)", () => {
        const content = `
Sure, let's update.

### Update \`components/ai.yml\`

\`\`\`yaml
services:
  test: image
\`\`\`

### Update \`configs/unbound/a-records.conf\`

\`\`\`plaintext
ai.miguelaperez.dev.  IN  A   192.168.1.212
\`\`\`
`;
        const result = parseDiffs(content, null, {});
        expect(Object.keys(result.suggestion.filesChanged)).toContain("components/ai.yml");
        expect(Object.keys(result.suggestion.filesChanged)).toContain("configs/unbound/a-records.conf");
        expect(result.suggestion.filesChanged["components/ai.yml"].suggestedContent).toBe("services:\n  test: image");
    });

    it("should correctly parse @path fallback", () => {
        const content = `
Update @src/lib/utils.ts:

\`\`\`typescript
console.log('hi');
\`\`\`
`;
        const result = parseDiffs(content, null, {});
        expect(Object.keys(result.suggestion.filesChanged)).toContain("src/lib/utils.ts");
        expect(result.suggestion.filesChanged["src/lib/utils.ts"].suggestedContent).toBe("console.log('hi');");
    });
});
