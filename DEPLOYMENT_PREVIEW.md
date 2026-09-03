# Deployment status — v0.7

## Production

Live GitHub Pages URL:

`https://unknwnawknd.github.io/music-theory-app---public-/`

The repository deploys automatically from `main` after the test/build workflow succeeds.

## Supabase

The dedicated `music-theory-tutor` Supabase project is created, migrated, and wired into `web/config.js` using only public browser credentials.

RLS is enabled for all learner-owned tables; anonymous users have no learner-table grants. Attempts and scheduler review history are append-only from the client. Supabase security advisor reports no findings.

## Remaining Auth dashboard setting

Password signup sends confirmation back to the deployed app URL. Supabase Auth URL Configuration should include this exact production URL as an allowed redirect (and preferably as the Site URL):

`https://unknwnawknd.github.io/music-theory-app---public-/`

This setting is managed in the hosted Supabase Auth dashboard and is not exposed by the connected project-management tools used here.

## Verification

Run:

```bash
npm install
npm test
npm run build:site
```

The GitHub Pages workflow performs the test/build/deploy chain automatically.
