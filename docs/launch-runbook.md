# Launch day: moving from Bubble to the new app (Sunday)

One switch, `LAUNCHED=yes` in Vercel, makes the new app the live system:

- Carer texts and automatic emails are sent from the new app (no need to set `SMS_MODE` or `AUTOMATIONS`).
- Nothing is written back to Bubble.
- Klarra's checks (Saturday conflicts and gaps, away alerts) read the new app's roster.
- Links in texts and emails point at https://knightingale.com.au.
- The Bubble-style API at `knightingale.com.au/api/1.1/obj/...` also accepts the old Bubble API token, so Klarra
  (all Railway services) keeps working unchanged once the domain points at Vercel.

Leave `LAUNCHED` unset until step 5.

## Before Sunday (Paul)

1. Vercel > knightingale project > Domains: add `knightingale.com.au` and `www.knightingale.com.au`. Note the DNS
   records Vercel asks for. Don't change DNS yet.
2. Supabase > Authentication > URL configuration: add `https://knightingale.com.au/**` to the redirect URLs.
3. Check Klarra's `BUBBLE_API_TOKEN` (Railway) is the same token as Vercel's `BUBBLE_API_TOKEN`. If not, add Klarra's
   token to a Vercel variable `DATA_API_TOKENS` (Sensitive).
4. Railway > Sms Inbound: set `CARERTEXTS_SECRET` to the same value as Vercel's `KLARRA_SHARED_SECRET`.

## Sunday morning

1. **Freeze Bubble.** Tell staff not to use Bubble from now. In Bubble, pause scheduled workflows
   (Logs > Scheduler > Pause) so nothing else runs there.
2. **Move the data (Claude).** Run the Bubble sync until it has caught up on everything since mid-November, apply it,
   then run the reconcile pass so deletions come across. Check counts match Bubble. About 1 to 2 hours; it uses
   Bubble workload units once.
3. **Point the domain.** At the registrar, change the DNS for `knightingale.com.au` and `www` to the Vercel records.
4. **Supabase:** set the Site URL to `https://knightingale.com.au`.
5. **Flip the switch.** Vercel > Settings > Environment Variables: add `LAUNCHED` = `yes` (Production), then redeploy.
6. **Railway > CarerTexts:** set `SMS_MODE` to `dry` (the new app now sends check-in and progress note texts, so this
   would double up). Shift-Sync and Daily Data Update can stay: they now read the new app.
7. **Smoke test** (Claude and Paul):
   - Admin: create, assign, cancel a shift; Klarra still answers a text; timesheets Pay.
   - Carer (a real carer's phone): sign in, check in, progress note, payslips.
   - Coordinator: calendar. Facility: book a carer.
   - Text log in the app shows texts as sent, not dry run.

## If something goes wrong

Remove `LAUNCHED` in Vercel and redeploy, and point DNS back to Bubble. Bubble still has its data as of the freeze.
