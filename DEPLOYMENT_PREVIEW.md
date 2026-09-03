# Deployment plan — v0.7

## Preferred: GitHub repository + static hosting
The app is a static client plus Supabase. No private server secret is needed in the browser. The committed Supabase publishable key is intentionally public; RLS protects learner rows.

1. Create a private repository named `music-theory-tutor` under the connected GitHub account.
2. Push this project to `main`.
3. Build with `npm run build:site` or publish the prebuilt static site.
4. If GitHub Pages is supported for the account/repository, publish the static site there. Otherwise use Netlify with the same files.

## Supabase
Dedicated project is already created and migrated. Production URL is wired into `web/config.js`. The app uses Supabase Auth and the publishable browser key only.

## Security
RLS is enabled for all learner-owned tables; anon has no table grants. Attempts and scheduler review history are append-only from the client. Supabase security advisor reported no findings after migration.
