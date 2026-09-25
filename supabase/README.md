# Supabase Phase 1 Setup

ANNORA's Phase 1 Supabase foundation is defined in `schema.sql`.

## Configure locally

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Add the project URL and anon key:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never prefix it with `NEXT_PUBLIC_`.
5. Apply `schema.sql` in the Supabase SQL editor or through the Supabase CLI.
6. Enable email/password authentication in Supabase Auth.
7. Restart the Next.js server after changing environment variables.

## Phase 1 scope

The schema includes profiles, donor profiles, driver profiles, NGOs, private NGO documents, donations, matches, deliveries, impact events, notifications, audit logs, chat sessions/messages, and AI tool-call records.

RLS is enabled on all Phase 1 tables. Policies are ownership- and role-aware. The application now supports a clear external-server configuration path: if `NEXT_PUBLIC_SUPABASE_URL` and the matching Supabase keys are present, the app is ready to run against Supabase; otherwise it continues to use the local SQLite adapter for local development and testing.
