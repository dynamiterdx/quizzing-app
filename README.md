# Practice Better — Minimal Next.js Quizzing App

A fast, no-login web app with two modes:

- Targeted Quiz: generate and grade a focused multiple-choice quiz.
- Help Me Prepare: adaptive prep that builds a small subtopic map, runs a diagnostic, and drills weak areas.

Backed by Azure OpenAI Responses API with strict JSON Schema outputs for reliable rendering and deterministic grading.

## Setup

1. Create an Azure OpenAI resource and a model deployment (e.g., `gpt-4o-mini`).
2. Copy `.env.local.example` to `.env.local` and fill in values:

```
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE-NAME.openai.azure.com
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-10-21
```

3. Install and run:

```
npm install
npm run dev
```

Open http://localhost:3000

## Notes

- No authentication or server-side storage; all state is session-local.
- The app validates model outputs and will re-request if quality checks fail.
- Accessibility: keyboard-friendly controls, visible focus rings, readable contrast.
- Mobile-friendly: simple responsive layout.
- Friendly error handling with retries for transient errors.

## Tech

- Next.js App Router (TypeScript)
- Azure OpenAI Responses API with JSON Schema structured outputs

