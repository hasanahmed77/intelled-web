# intellED

Minimal, dark-themed worksheet generator built with Next.js and Supabase.

## Quick start

1. Create a Supabase project.
2. In the SQL editor, run the contents of `supabase-schema.sql`.
3. In the SQL editor, run the contents of `supabase-billing.sql`.
4. Copy `.env.example` to `.env.local` and fill in your Supabase keys.
5. Add `SUPABASE_SERVICE_ROLE_KEY` for server-only billing operations.
6. Install dependencies and run the app.

```bash
npm install
npm run dev
```

## Core pages

- `/` Landing page
- `/pricing` Pricing
- `/practice` Generate and list worksheets (auth required)
- `/practice/[id]` Answer worksheet + feedback
- `/profile` Progress and attempts
- `/auth` Email/password login

## Notes

- Worksheets are generated via OpenAI and stored with prompts only (no answers).
- AI grading evaluates answers based on the question prompts and user responses.
- Difficulty `auto` uses average attempt score thresholds:
  - 80+ → hard
  - 50-79 → medium
  - below 50 → easy

## OpenAI API

Set the following in `.env.local`:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (example `gpt-5-mini`)

## Billing

- Every user starts on the `free` plan automatically
- The free plan allows 3 worksheets for the lifetime of the account
- Paid plans are modeled in Supabase and enforced during worksheet generation
- The current implementation uses a dummy internal recurring flow so the subscription system can be tested before a real gateway such as bKash is added
