# Semantic Search

## Description

This skill allows the agent to perform semantic search across the current repository to find relevant code snippets, functions, or documentation based on natural language queries.

## Usage

The skill takes a query string as an argument and returns a list of matching code chunks with their file paths and line numbers.

[search query]

- query: The search term or question to find in the codebase.
- limit: (Optional) The maximum number of results to return.

## Example

index.ts "How is authentication handled?"
