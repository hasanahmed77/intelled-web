# intellED

AI-powered worksheet generator that creates personalized problem sets for students across O/A Levels, SSC, HSC, IELTS, GRE, SAT, and school subjects. Uses OpenAI for both generation and grading. Available in English and Bengali.

# Stack

- **Frontend:** Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS, MathJax
- **Backend:** Next.js Server Actions (`src/app/actions/`)
- **Database/Auth:** Supabase (PostgreSQL + Row-Level Security + Supabase Auth)
- **AI:** OpenAI API — worksheet generation and grading
- **Validation:** Zod

# Project structure

```
src/app/             - Pages (App Router)
src/app/actions/     - Server Actions
src/app/practice/    - Worksheet generation + solving pages (protected)
src/app/profile/     - User dashboard + subscription (protected)
src/components/      - Shared UI components
src/lib/             - Core logic
src/lib/billing/     - Subscription and usage tracking
src/lib/profile/     - User profile helpers
src/lib/worksheet/   - Generation, grading, types, limits
src/lib/openai.ts    - OpenAI integration (generation + grading)
src/lib/auth.ts      - Auth helpers
src/lib/supabase/    - Supabase client setup
```

# Caching

- `listActivePlans()` — wrapped with `unstable_cache` (1hr TTL, tag: `billing-plans`). Same data for all users.
- `fetchProfile()` — wrapped with React `cache()`. Deduplicates 3 calls per request across practice, practice/[id], and profile pages.
- Do NOT use the `'use cache'` directive or enable `cacheComponents: true` in next.config.js — it activates full dynamicIO mode and requires Suspense wrapping on every uncached DB call, which is too invasive for this project.

# Billing

- Plans: Free (2 worksheets lifetime), Weekly, Monthly, Yearly — priced in BDT
- `getCurrentSubscription()` must always be fresh — do not cache it
- Billing schema files: `supabase-billing.sql`

# Key conventions

- All DB-facing code lives in `src/lib/` — pages and actions call these helpers, not Supabase directly
- Protected routes: `/practice` and `/profile` — enforced via middleware
- Worksheets generate 5 questions per set (OpenAI schema has minItems/maxItems: 5, Zod schema has .length(5))
- Mathematical notation: inline LaTeX only `\( ... \)` — never block/display LaTeX
- Auto-cleanup trigger keeps only the 10 most recent worksheets per user

# Landing page (home page)

- The outer div uses `w-screen` + `style={{ marginLeft: "calc(50% - 50vw)" }}` to break out of the layout's `max-w-6xl px-6 mx-auto` main container — this gives the hero full viewport width. Do not remove this.
- The robot hero image uses `mix-blend-screen` to blend into the black background — makes the JPG's dark pixels transparent. Do not remove this.
- Image is fixed-width and centered (`left-1/2 -translate-x-1/2`), not full-width — the blend mode makes side gaps invisible against the black background.

# What NOT to do

- Do not cache `getCurrentSubscription()` — must be real-time
- Do not enable `cacheComponents: true` in next.config.js
- Do not use `'use cache'` directive anywhere
- Do not remove `mix-blend-screen` or the `marginLeft` style from the home page
- Do not add `max-w` constraints to the hero image
