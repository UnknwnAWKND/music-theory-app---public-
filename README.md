# Music Theory Tutor

Personal adaptive web tutor for practical music theory.

## Live app

https://unknwnawknd.github.io/music-theory-app---public-/

## Learning model

- Tiny prerequisite-linked micro-skills
- Retrieval before rereading
- Corrective feedback and scaffolded repair
- READY is separate from long-term RETAINED
- FSRS-6 handles review timing only
- Old material keeps returning through spaced retrieval
- No ear-training or audio-recognition curriculum
- Piano-first theory, guitar transfer later

## Architecture

- Static browser app
- TypeScript theory/curriculum/learning engine
- Supabase Auth + Postgres persistence
- Row-level security on all learner-owned data
- Generated theory questions validated algorithmically

## Verify

```bash
npm install
npm test
```

## Build

```bash
npm run build:site
```

The dedicated production Supabase project is already configured with public browser credentials. RLS, not the publishable key, protects private learner data.

## Hosting

GitHub Pages deploys automatically from `main` after the test/build workflow succeeds.

## Auth deployment note

Password signup uses the deployed app URL as its email-confirmation return URL. Supabase Auth must allow this exact production redirect URL:

`https://unknwnawknd.github.io/music-theory-app---public-/`
