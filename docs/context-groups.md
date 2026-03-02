# Context Groups

Context Groups are the core building blocks of the benchmarking system in this application. They represent individual "test cases" or "evaluation scenarios" that can be reused across different models and benchmark runs.

## Purpose

The primary purpose of Context Groups is to provide a **standardized and repeatable environment** for evaluating model performance. Instead of manually testing prompts, you define a Context Group once and then "run" it against any number of models to compare their outputs objectively.

## Components of a Context Group

Each Context Group consists of several key elements:

### 1. Metadata

- **Name & Description**: Clearly identify what the group is testing (e.g., "Python Regex Optimization").
- **Category**: Used for aggregated reporting (e.g., `Coding`, `Reasoning`, `Technical`).
- **Weight**: Determines how much this specific group contributes to the overall score of a benchmark run.

### 2. Prompt Configuration

- **Prompt Template**: The actual instruction sent to the model.
- **System Context**: An optional override for the model's base system prompt, allowing you to force specific personas or constraints for this test.
- **Max Sentences**: An automated constraint that penalizes the score if the model's response is too wordy.

### 3. Capabilities

- **Skills**: Associate specific agent skills that should be available to the model during this test.
- **Tools**: Associate specific tools (JSON schemas) that the model should be aware of.

### 4. Expectations (Evaluation Logic)

This is the most critical part of a Context Group. Expectations define the criteria for a "successful" response.

| Type | Description | Example |
| :--- | :--- | :--- |
| `contains` | The response must contain the specified string. | `import os` |
| `not_contains` | The response must **NOT** contain the specified string. | `Error` |
| `regex` | The response must match a regular expression pattern. | `/\d{3}-\d{2}-\d{4}/` |
| `exact` | The response must match the value exactly (case-insensitive). | `Yes` |

## How to Use Context Groups

1. **Creation**: Navigate to the **Evaluation Lab** and select the **Context Groups** tab. Here you can create new groups or edit existing ones.
2. **Definition**: Define your prompt and, more importantly, your **Expectations**. Think about what a "perfect" answer looks like and translate that into `contains` or `regex` rules.
3. **Execution**: When creating a **Benchmark Run**, select the Context Groups you want to include.
4. **Analysis**: Once a benchmark completes, the system automatically evaluates the model's output against your expectations and provides a percentage score based on how many rules were satisfied.

## Best Practices

- **Atomic Tests**: Keep Context Groups focused on one specific capability or edge case.
- **Varied Expectations**: Combine multiple expectations (e.g., a `contains` for the must-have code and a `not_contains` for common pitfalls).
- **Categorize for Clarity**: Use categories like `Security`, `Performance`, or `Compliance` to see high-level trends in model performance.
