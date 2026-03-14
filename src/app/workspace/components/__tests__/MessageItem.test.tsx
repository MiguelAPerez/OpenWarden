/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MessageItem } from "../MessageItem";
import "@testing-library/jest-dom";

// Mock SyntaxHighlighter because it's heavy and hard to test in simple JSDOM
jest.mock("react-syntax-highlighter", () => ({
    Prism: ({ children }: any) => <pre data-testid="syntax-highlighter">{children}</pre>,
}));

// Mock react-markdown and remark-gfm to avoid ESM issues
jest.mock("react-markdown", () => {
    const MockMarkdown = ({ children }: any) => {
        return <div data-testid="markdown">{children}</div>;
    };
    MockMarkdown.displayName = "MockMarkdown";
    return MockMarkdown;
});
jest.mock("remark-gfm", () => ({}));

// Mock the style import specifically
jest.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({
    vscDarkPlus: {},
}), { virtual: true });

describe("MessageItem", () => {
    test("renders user message correctly", () => {
        render(<MessageItem role="user" content="Hello assistant" />);
        
        expect(screen.getByText("Hello assistant")).toBeInTheDocument();
        // User message should have white-space-pre-wrap div
        expect(screen.getByText("Hello assistant")).toHaveClass("whitespace-pre-wrap");
    });

    test("renders assistant message correctly", () => {
        render(<MessageItem role="assistant" content="Hello human" />);
        
        // Assistant message renders inside out mock markdown div
        expect(screen.getByTestId("markdown")).toHaveTextContent("Hello human");
    });

    test("renders assistant message with markdown content", () => {
        const markdown = "Here is some **bold** text";
        render(<MessageItem role="assistant" content={markdown} />);
        
        expect(screen.getByTestId("markdown")).toHaveTextContent("Here is some **bold** text");
    });

    test("renders assistant message with code blocks", () => {
        const content = "Check this code:\n\n```typescript\nconst a = 1;\n```";
        render(<MessageItem role="assistant" content={content} />);
        
        // With our simple mock, the content should still be present
        expect(screen.getByTestId("markdown")).toHaveTextContent("const a = 1;");
    });
});
