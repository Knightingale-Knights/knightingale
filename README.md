# knightingale

Custom rebuild of the Knightingale Bubble app (`florence-26575`).

## Stack
- Next.js on Vercel
- Supabase (Postgres, auth, storage, scheduler), project `zfirdbbyiagmrfsmcqrx`, schema `app`

## Layout
- `supabase/migrations/` database migrations
- `supabase/bubble_map.json` Bubble type/field keys to table/column, used for data migration
- `scripts/gen_schema.py` regenerates the schema from a Bubble export

Never commit the `.bubble` export. It contains live API keys.
