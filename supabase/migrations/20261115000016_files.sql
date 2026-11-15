-- Copy Bubble's stored files into Supabase Storage (private bucket "files"), so they outlive Bubble.
-- sync.queue_bubble_files() lists every Bubble file the app's records point to; the bubble-files edge function copies them.
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('files', 'files', false) on conflict (id) do nothing;
  end if;
end $$;

create table if not exists app.file_copies (
  url text primary key,
  path text,
  bytes bigint,
  mime text,
  site boolean not null default false, -- a website image (served publicly)
  status text not null default 'pending' check (status in ('pending', 'copied', 'failed', 'missing')),
  attempts int not null default 0,
  error text,
  claimed_at timestamptz,
  copied_at timestamptz
);
alter table app.file_copies enable row level security;
create index if not exists file_copies_pending on app.file_copies (status) where status in ('pending', 'failed');

create or replace function sync.queue_bubble_files() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  insert into app.file_copies (url)
  select distinct url from (
      select contract_signature as url from app.users where contract_signature like 'http%'
      union select ndis_induction as url from app.users where ndis_induction like 'http%'
      union select profile_photo as url from app.users where profile_photo like 'http%'
      union select resume as url from app.users where resume like 'http%'
      union select participant_signature as url from app.consents where participant_signature like 'http%'
      union select cpr_certificate as url from app.cpr_certificates where cpr_certificate like 'http%'
      union select doc as url from app.participant_documents where doc like 'http%'
      union select participant_signature as url from app.emergency_plans where participant_signature like 'http%'
      union select signature as url from app.feedback where signature like 'http%'
      union select first_aid_certificate as url from app.first_aid_certificates where first_aid_certificate like 'http%'
      union select citizenship as url from app.identity_documents where citizenship like 'http%'
      union select insurance as url from app.identity_documents where insurance like 'http%'
      union select license as url from app.identity_documents where license like 'http%'
      union select passport as url from app.identity_documents where passport like 'http%'
      union select participant_signature as url from app.info_book_signoffs where participant_signature like 'http%'
      union select representative_signature as url from app.info_book_signoffs where representative_signature like 'http%'
      union select knightingale_signature as url from app.intakes where knightingale_signature like 'http%'
      union select participant_signature as url from app.intakes where participant_signature like 'http%'
      union select representative_signature as url from app.intakes where representative_signature like 'http%'
      union select invoice_file as url from app.invoices where invoice_file like 'http%'
      union select invoice_image as url from app.invoices where invoice_image like 'http%'
      union select handbook as url from app.locations where handbook like 'http%'
      union select attachment as url from app.messages where attachment like 'http%'
      union select image as url from app.police_checks where image like 'http%'
      union select u from app.progress_notes, unnest(pics) u where u like 'http%'
      union select u from app.qualifications, unnest(ahpra) u where u like 'http%'
      union select u from app.qualifications, unnest(transcript) u where u like 'http%'
      union select participant_signature as url from app.risk_assessments where participant_signature like 'http%'
      union select participant_signature as url from app.service_agreements where participant_signature like 'http%'
      union select representative_signature as url from app.service_agreements where representative_signature like 'http%'
      union select u from app.shifts, unnest(receipts) u where u like 'http%'
      union select image_after as url from app.shift_logs where image_after like 'http%'
      union select image_before as url from app.shift_logs where image_before like 'http%'
      union select signature as url from app.superannuation where signature like 'http%'
      union select smsf_doc as url from app.superannuation where smsf_doc like 'http%'
      union select participant_signature as url from app.support_plans where participant_signature like 'http%'
      union select signature as url from app.tfn_declarations where signature like 'http%'
      union select u from app.vaccinations, unnest(covid19) u where u like 'http%'
      union select flu as url from app.vaccinations where flu like 'http%'
      union select u from app.vaccinations, unnest(influenza) u where u like 'http%'
      union select video as url from app.videos where video like 'http%'
      union select image as url from app.wwcc_checks where image like 'http%'
  ) x(url)
  on conflict (url) do nothing;
  get diagnostics n = row_count;
  -- Images used on the public website
  insert into app.file_copies (url, site) values
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1739675363360x976703196635051300/Screenshot%202025-02-16%20at%202.08.55%E2%80%AFPM.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1768521379877x600677353425577000/Knightingale_can_you_put_a_head_on_this_image_please_a_brunet_0a2877ed-7815-4a04-acfd-03778e921b79_3.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1771111544743x425208661696886200/Screenshot%202026-02-15%20at%2010.25.27%E2%80%AFAM.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1772042238440x116884699991349760/Knightingale_3_nurses_walking_along_an_outdoor_path_between_b_cb7e5e44-cda9-40d2-b8b0-77b8b0abc6f6_1.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1787002176495x263525649616596740/logo.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1787002232942x309472060946787140/MCM%20logo_yourfuture.webp', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1787002514497x161789784284212860/Logo.webp', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1787002699824x644095009887354600/brotherhood-st-laurence-transparent_1.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1787654359403x786738419700043300/Untitled%20%283%29.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1788518479166x753884665652826400/knightingale_framed_photo%201%20%282%29.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1788518641269x189607436259301440/knightingale_framed_photo%201%20%283%29.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1788518761482x936751228403373200/knightingale_framed_photo%201%20%284%29.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1788655994978x503293554270718660/knightingale_framed_photo%201%20%286%29.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1788818872218x794523780046486700/knightingale_framed_photo%201%20%284%29.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1789183483343x813446794027089900/Screenshot%202026-09-12%20at%201.24.22%E2%80%AFpm.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1789183887080x279153141236176740/Screenshot%202026-09-12%20at%201.30.57%E2%80%AFpm.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1789184937592x365886377610574700/Screenshot%202026-09-12%20at%201.47.25%E2%80%AFpm.png', true),
    ('https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io/f1789352005528x511695458438172350/Screenshot%202026-09-14%20at%2012.13.07%E2%80%AFpm.png', true)
  on conflict (url) do update set site = true;
  return n;
end $$;
