# Module 25 — Model Router

**Phase:** 0 (abstraction), 1 (routing)

## Purpose

Not every request goes to GPT. Route by task type:

| Task Type | Preferred Model |
|-----------|-----------------|
| Planning | High-reasoning (Claude/GPT-4) |
| Extraction | Fast/cheap (GPT-4o-mini, Haiku) |
| Long context | Gemini / Claude |
| Code/GitHub | Specialized or GPT |
| Open source fallback | Llama, Qwen, Mixtral |

## Implementation

LiteLLM as unified gateway; LangGraph for stateful workflows.
