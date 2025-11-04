# Quizzaroo — LLM-Powered Quizzing App

Quizzaroo is a fast, no-login study companion that mixes adaptive learning flow with AI-generated multiple-choice questions. This README offers two complete views of the app:

- **Guide for Learners & Coaches** — product features and how to get value immediately (no code talk).
- **Guide for Developers** — deep dive into architecture, Azure OpenAI integration, validation guardrails, and local setup.

Use whichever view fits your needs, or jump between them with the table of contents below.

## Table of Contents
- [Guide for Learners & Coaches](#guide-for-learners--coaches)
  - [What You Get](#what-you-get)
  - [Modes in Plain English](#modes-in-plain-english)
  - [How to Start Practicing](#how-to-start-practicing)
  - [Feature Highlights](#feature-highlights)
  - [Friendly FAQ](#friendly-faq)
- [Guide for Developers](#guide-for-developers)
  - [Stack at a Glance](#stack-at-a-glance)
  - [Architecture Walkthrough](#architecture-walkthrough)
  - [Data Flow by Mode](#data-flow-by-mode)
  - [Azure OpenAI Integration](#azure-openai-integration)
  - [Validation, Safety, and UX Details](#validation-safety-and-ux-details)
  - [Local Development & Commands](#local-development--commands)
  - [Environment & Secrets](#environment--secrets)
  - [CLI Script & Sample Endpoint](#cli-script--sample-endpoint)
  - [Extending the App](#extending-the-app)
  - [Deployment Notes & Troubleshooting](#deployment-notes--troubleshooting)

---

## Guide for Learners & Coaches

### What You Get
- **Instant practice** on any topic; just describe what you need and go.
- **Two complementary modes**: one for quick quizzes, one for guided prep.
- **Clear explanations** after every question so you know why answers matter.
- **Progress nudges** that highlight weak spots and drill until you improve.
- **No accounts, no tracking** — everything stays in your browser session.

### Modes in Plain English
- `🎯 Targeted Quiz` — Type a topic (e.g., “Binomial Theorem” or “Intro Spanish verbs”), choose a difficulty, and instantly get a multiple-choice quiz. The app grades itself and shows you the reasoning behind each correct answer. Missed anything? Click “Practice similar to missed” to get tailored follow-ups.
- `📈 Help Me Prepare` — Start with a broad goal (like “Statistics” or “Anatomy basics”). Quizzaroo will:
  1. Build a simple subtopic map and let you edit, reorder, include/exclude, or simplify it before any questions are generated.
  2. Run a diagnostic quiz with ~3 questions per approved subtopic.
  3. Identify weaker areas, let you fine-tune the list, then drill with fresh questions.
  4. Track how your score in those areas improves across rounds.

Both modes work in English by default, and you can request questions in other languages — handy for language practice or multilingual classrooms.

### How to Start Practicing
1. **Open the app** (local URL is usually http://localhost:3000 during testing; deployed URL depends on your host).
2. **Pick a mode** from the home page cards.
   - First visit? You’ll be redirected to the **LLM Settings** page to choose Azure or Perplexity (Sonar / Sonar Pro) and paste the required API key. Azure OpenAI now also asks for its API key in this screen (endpoints/deployments still come from the server environment). Use the “Use environment key” button if you’ve already set the key in `.env.local`; you can revisit this screen anytime via the header link.
3. **Fill in the small form**: topic, difficulty, number of questions (up to 30), optional timer, and language. Languages supported today: English (`en`), Hindi (`hi`), French (`fr`), Español (`es`), Português (`pt`), Dutch (`nl`), German (`de`), and Turkish (`tr`).
4. **Hit generate** and answer at your own pace. Keyboard navigation works everywhere.
5. **Review explanations** to learn why each answer is right, then drill any gaps. Use the **Export quiz as PDF** button to share or print the quiz (a clean two-section layout with questions first and solutions after).

### Feature Highlights
- **Adaptive follow-up**: the app gathers subtopics from wrong answers and offers targeted drills.
- **Timed practice**: turn on a countdown to simulate test pressure; unfinished questions count as incorrect when time expires.
- **Accessible by design**: high contrast, focus rings, semantic regions, ARIA labels, and fully clickable answer areas.
- **Markdown + LaTeX**: supports math formulas, code snippets, and tables directly in questions and explanations (exports render math in plain text so everyone can read it).
- **Mobile-friendly layout**: cards stack cleanly, inputs have large touch targets, and the timer stays visible.
- **Gentle scoring feedback**: color-coded score banners celebrate progress rather than punish mistakes.
- **Printable exports**: download any generated quiz—before or after submission—as a monochrome PDF for candidates or offline review.

### Friendly FAQ
- **Is my data saved?** No. Everything lives in your current browser tab. Close it and the session ends.
- **Do I need an account?** Never. Quizzaroo is friction-free on purpose.
- **Can I switch languages?** Yes. Change the language field before generating a quiz.
- **What happens if the AI hiccups?** You’ll see a friendly error message with a retry button. Occasional delays can happen if the AI model is rate-limited.
- **Is there a quick demo?** Yes — visit `/sample` and click “Run Sample Call” to see a tiny structured response arrive.

---

## Guide for Developers

### Stack at a Glance
- **Framework**: Next.js 14 App Router with TypeScript (`app/` directory).
- **UI**: React 18, client components for interactive quiz flow, custom CSS (`app/globals.css`) styled for accessibility.
- **Markdown & Math**: `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, plus `katex` styles in the global layout.
- **LLM Providers**: Azure OpenAI Chat Completions (JSON Schema response_format) and Perplexity Sonar/Sonar Pro (prompted JSON with strict parsing).
- **Tooling**: ESLint (`npm run lint`), TypeScript strict mode, optional CLI script (`scripts/sample-quiz.mjs`).

### Architecture Walkthrough
- `app/layout.tsx`: global shell, metadata, and top-level styling/layout.
- `app/page.tsx`: marketing-style landing cards for the two modes.
- `app/targeted/page.tsx`: interactive client component for quick quizzes.
- `app/prepare/page.tsx`: multi-step adaptive prep workflow.
- `app/sample/page.tsx`: simple UI to exercise the sample API endpoint.
- `components/`: reusable UI pieces (`QuizRunner`, `QuestionCard`, `ProgressBar`, `Timer`, markdown renderer, loading skeletons, and error notice).
- `app/api/*/route.ts`: serverless endpoints that orchestrate Azure OpenAI or Perplexity calls with strict JSON schemas for quiz data.
- `lib/azure.ts`: shared Azure helper that enforces schema-constrained responses, retries with fallbacks, and validates quizzes.
- `types/quiz.ts`: shared TypeScript contracts for quizzes, subtopics, and adaptive prep metadata.

### Data Flow by Mode
**Targeted Quiz**
1. Client posts to `/api/generate-quiz` with topic, difficulty, quantity, timed flag, language, and chosen provider (Azure or Perplexity).
2. Route builds a JSON schema describing the quiz payload, calls `azureChatJson` or `perplexityChatJson`, and validates the response via `validateQuiz`.
3. `QuizRunner` renders multiple-choice cards, collects selections, and computes scores client-side.
4. When the learner requests “Practice similar to missed,” the client posts the set of missed subtopics to `/api/drill-quiz` for a follow-up set.

**Help Me Prepare**
1. Learner enters a broad topic → client calls `/api/subtopic-map` (against the selected provider) to build a 2–3 level hierarchy.
2. Immediately afterwards, the client requests `/api/diagnostic-quiz` (same provider) to sample those subtopics in a 6-question diagnostic.
3. After submission, `QuizRunner` identifies missed questions; the page records weak subtopics and prompts the learner to confirm or adjust them.
4. `/api/drill-quiz` produces short targeted drills. Scores are tracked locally per subtopic (`scores` state), with difficulty level auto-escalating on strong performance.
5. When all tracked subtopics exceed a mastery threshold, the UI shows a summary card listing initial vs latest scores and offers to keep practicing.

### Azure OpenAI Integration
- `azureChatJson` builds a chat completion payload with:
  - System prompt embedding the JSON schema directly in the message.
  - JSON Schema response_format (strict mode). If the deployment rejects this (HTTP 400), the helper automatically retries with `json_object`, then plain text prompting.
  - Deterministic `seed` (default 7) but still allows `temperature` overrides per endpoint.
- `tryParseJson` is defensive: if the model returns text wrapped around JSON, it attempts to extract the JSON slice before failing.
- Endpoints use per-route schemas so the LLM is constrained to required fields (IDs, choices, explanations, per-question difficulty and subtopic tags).
- `validateQuiz` performs post-generation structural checks (unique IDs, minimum choices, presence of the correct answer, duplicate-choice guard).

### Perplexity Sonar Integration
- `perplexityChatJson` hits `https://api.perplexity.ai/chat/completions` with the Sonar or Sonar Pro model.
- System prompts embed the JSON schema and instruct the model to answer with JSON only; the helper strictly parses the returned text.
- Retries mirror the Azure helper: quick exponential backoff and JSON-slice extraction when extra prose sneaks in.
- If `PERPLEXITY_API_KEY` is missing, the helper throws a descriptive error so the UI can surface a helpful message.

### Validation, Safety, and UX Details
- Error handling: Each route retries up to three attempts before returning 5xx with a plain error; client surfaces via `ErrorNotice`.
- Loading UX: `LoadingQuiz` renders a shimmer skeleton plus a spinner to reassure the learner while the LLM responds.
- Accessibility: ARIA roles on progress bars, score banners, and radiogroups; focus outlines for keyboard users; high contrast palette and large touch zones.
- Markdown safety: `MarkdownText` sets `skipHtml` to block raw HTML injection. All Markdown is rendered inside sanitized spans.
- Language picker: both modes expose a dropdown wired to eight ISO language codes (English, Hindi, French, Español, Português, Dutch, German, Turkish). The label travels with each request so the model can answer in the chosen language.
- Export: `lib/exportQuiz.ts` converts any generated quiz into a print-ready two-section PDF via a temporary blob URL and the browser’s native print dialog—no client dependencies required.
- Timer: runs client-side with second-by-second updates, gracefully expires to mark unanswered questions incorrect.
- Styling: Single global stylesheet with design tokens, gradients for hero/score banners, and consistent spacing utilities.

### Local Development & Commands
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run in development**
   ```bash
   npm run dev
   ```
   Access the app at http://localhost:3000.
3. **Production build / preview**
   ```bash
   npm run build
   npm start
   ```
4. **Lint the project**
   ```bash
   npm run lint
   ```

### Environment & Secrets
Create `.env.local` with your Azure OpenAI credentials (and optional Perplexity key if you want to use Sonar or Sonar Pro):
```
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE-NAME.openai.azure.com
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-10-21
PERPLEXITY_API_KEY=your-perplexity-key
```

Notes:
- Endpoint format must include the protocol and resource host.
- Deployment name should match the model slot defined in Azure (defaults to `gpt-4o-mini` if omitted).
- `AZURE_OPENAI_API_VERSION` defaults to `2024-10-21`, but you can pin it to the version that matches your deployment.
- The helper logs a warning if endpoint or key are missing, making local debugging friendlier. Azure API keys are now supplied through the in-app LLM Settings screen (the environment variable acts as a fallback only). Perplexity support requires either the environment key or the one you paste into the settings screen.

### CLI Script & Sample Endpoint
- **`scripts/sample-quiz.mjs`**: Node CLI that loads `.env.local`, calls Azure Chat Completions with the same schema used in the app, and prints a quiz JSON payload. Helpful for debugging prompts or running smoke checks from a shell.
- **`app/sample/page.tsx` + `/api/sample`**: Minimal UI and API pair that request a structured greeting plus three short practice tips. Ideal for verifying credentials without running a full quiz.
- **`javascript.js`** (optional reference): Illustrates calling the OpenAI Responses API with Zod parsing. Not wired into the Next.js app but kept as an example.

### Extending the App
- **Add new quiz modes**: Create a client page in `app/<new-mode>/page.tsx`, wire it to a new API route, and reuse `QuizRunner`.
- **Custom scoring logic**: `QuizRunner` exposes answered counts, accuracy, and missed questions; enhance it with partial credit or written answers if needed.
- **Additional languages or prompts**: Modify the system/user prompts per route; ensure the schema remains in sync with `types/quiz.ts`.
- **Persistence**: Currently session-only. To store results, add a lightweight backend (Supabase, Planetscale, etc.) and persist quiz summaries after submission.
- **Model switching**: Update `.env.local` or inject `deployment` per request. `azureChatJson` already takes temperature/seed overrides.

### Deployment Notes & Troubleshooting
- Quizzaroo is SSR-friendly but renders quizzes entirely on the client, so deploying to Vercel or Azure Static Web Apps works well.
- Ensure environment variables are set in your hosting provider; without them, API routes will log warnings and return 500.
- If Azure blocks `response_format=json_schema`, make sure the deployment supports the 2024-05+ API versions; otherwise rely on the built-in fallback path.
- Rate limiting (HTTP 429) surfaces as “Rate limited. Please wait a few seconds and try again.” Encourage retry logic or smaller study groups if sharing credentials.
- For debugging unexpected quiz content, log the raw JSON returned by `azureChatJson` (temporarily) and inspect the prompts sent in each route.

Happy quizzing and happy hacking!
