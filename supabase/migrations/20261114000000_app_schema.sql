-- Knightingale app schema, generated from the Bubble export by scripts/gen_schema.py
-- Every table keeps bubble_id so data can be migrated and cross-referenced.

create schema if not exists app;

create or replace function app.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table app.users (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text unique,
  account_status boolean default false,
  active boolean default true,
  address jsonb,
  audit boolean default false,
  bank_details uuid,
  bday_text text,
  bsp uuid,
  can_drive boolean,
  care_culture uuid,
  client_care_date timestamptz,
  group_chat uuid,
  consent uuid,
  contract_date timestamptz,
  contract_signature text,
  coordinator uuid,
  coordinator_2 uuid,
  cpr uuid,
  current_location jsonb,
  daily_living uuid,
  date_of_birth timestamptz,
  description text,
  gross_pay numeric,
  emergency_plan uuid,
  first_aid uuid,
  first_name text,
  gps_latitude numeric,
  gps_longtitude numeric,
  handbook uuid,
  health_profile uuid,
  home_safety uuid,
  hours numeric,
  id_document uuid,
  info_book uuid,
  intake_form uuid,
  interests uuid,
  knowledge_base uuid,
  last_name text,
  medication_chart uuid,
  middle_name text,
  ndis uuid,
  ndis_induction text,
  ndis_number text,
  net_pay numeric,
  notification boolean default false,
  phone_number text,
  profile_photo text,
  plan_end timestamptz,
  plan_manager uuid,
  plan_start timestamptz,
  police_check uuid,
  priority numeric,
  account_type text default 'carer',
  progress_note boolean default false,
  rating numeric,
  resume text,
  risk_assessment uuid,
  roles text[],
  room_no text,
  service_agreement uuid,
  sex text,
  shift_time text[],
  super numeric,
  superannuation uuid,
  support_plan uuid,
  survey boolean default false,
  tax_file_number uuid,
  tax numeric,
  thread uuid,
  vaccinations uuid,
  website text,
  work_locations text[],
  wwcc uuid,
  ytd_gross numeric,
  ytd_net numeric,
  ytd_tax numeric
);
comment on table app.users is 'Bubble type user (User)';
create trigger users_updated_at before update on app.users for each row execute function app.set_updated_at();

create table app.availability (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  accepted text,
  active boolean,
  available boolean default false,
  carer uuid,
  date timestamptz,
  date_text text,
  locations text[],
  nurse_name text,
  nurse_phone text,
  priority numeric default 0,
  role text,
  role_text text,
  shift text,
  shift_text text,
  timeslot text,
  weekday text
);
comment on table app.availability is 'Bubble type availability (Availability)';
create trigger availability_updated_at before update on app.availability for each row execute function app.set_updated_at();

create table app.bank_details (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  acc_name text,
  acc_no text,
  bsb_no text,
  carer uuid,
  secure boolean default false
);
comment on table app.bank_details is 'Bubble type bank_details (Bank Details)';
create trigger bank_details_updated_at before update on app.bank_details for each row execute function app.set_updated_at();

create table app.calls (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  date text,
  location text,
  nurses text[],
  shift text,
  status text,
  thread uuid
);
comment on table app.calls is 'Bubble type calls (Calls)';
create trigger calls_updated_at before update on app.calls for each row execute function app.set_updated_at();

create table app.care_culture (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  compassion boolean,
  future boolean default false,
  hospitality boolean,
  intro boolean,
  lifer boolean,
  listen boolean,
  one boolean,
  paid boolean,
  philosophy boolean,
  proactive boolean,
  refusals boolean,
  to_do_list boolean,
  trust boolean,
  trust_video text,
  vision boolean
);
comment on table app.care_culture is 'Bubble type care_culture (Care Culture)';
create trigger care_culture_updated_at before update on app.care_culture for each row execute function app.set_updated_at();

create table app.client (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  billing_email text,
  billing uuid,
  client uuid
);
comment on table app.client is 'Bubble type client (Client)';
create trigger client_updated_at before update on app.client for each row execute function app.set_updated_at();

create table app.comms_book (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  participant uuid
);
comment on table app.comms_book is 'Bubble type comms_book (Group Chats)';
create trigger comms_book_updated_at before update on app.comms_book for each row execute function app.set_updated_at();

create table app.consent (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  f_10_sharing boolean,
  f_11_allied boolean,
  f_1_audits boolean,
  f_2_surveys boolean,
  f_3_ads boolean,
  f_4_recruitment boolean,
  f_5_reporting boolean,
  f_6_training boolean,
  f_7_marketing boolean,
  f_8_audiovisual boolean,
  f_9_photos boolean,
  consent_no text,
  consent_yes text,
  participant_signature text,
  participant uuid,
  signed_date timestamptz
);
comment on table app.consent is 'Bubble type consent (Consent)';
create trigger consent_updated_at before update on app.consent for each row execute function app.set_updated_at();

create table app.cpr1 (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  cpr_certificate text,
  expiry timestamptz
);
comment on table app.cpr1 is 'Bubble type cpr1 (CPR)';
create trigger cpr1_updated_at before update on app.cpr1 for each row execute function app.set_updated_at();

create table app.daily_living (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer_pref_age text,
  carer_pref_culture_religion text,
  carer_pref_gender text,
  carer_pref_language text,
  carer_pref_personality text,
  carer_training_required text,
  carer_unique_skills text,
  daily_tasks_assistance text,
  dietary_requirements text,
  foods_disliked text,
  foods_liked text,
  goals_long_term text,
  goals_short_term text,
  hobbies text,
  living_situation text,
  mobility_aids text,
  participant uuid,
  personal_care text[],
  personal_care_other text,
  supports_needed text,
  unmet_needs text
);
comment on table app.daily_living is 'Bubble type daily_living (Daily Living)';
create trigger daily_living_updated_at before update on app.daily_living for each row execute function app.set_updated_at();

create table app.document (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  audit boolean default false,
  doc text,
  name text,
  participant uuid
);
comment on table app.document is 'Bubble type document (Document)';
create trigger document_updated_at before update on app.document for each row execute function app.set_updated_at();

create table app.emergency_plan (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  backup_power text,
  fire_evacuation text,
  fire_steps text,
  hospital_steps text,
  hospital text,
  infectious_steps text,
  infectious text,
  natural_disaster_steps text,
  natural_disaster text,
  participant_signature text,
  participant uuid,
  power_outage text,
  signed_date timestamptz,
  supplies text
);
comment on table app.emergency_plan is 'Bubble type emergency_plan (Emergency Plan)';
create trigger emergency_plan_updated_at before update on app.emergency_plan for each row execute function app.set_updated_at();

create table app.esw (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  activity_code text,
  date timestamptz,
  duration numeric,
  feedback text,
  offsite boolean,
  onsite boolean,
  refusal boolean,
  resident uuid,
  support_level numeric
);
comment on table app.esw is 'Bubble type esw (Esw)';
create trigger esw_updated_at before update on app.esw for each row execute function app.set_updated_at();

create table app.event (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  address jsonb,
  carer uuid,
  coordinator uuid,
  date timestamptz,
  details text,
  done boolean,
  notes text,
  refused boolean,
  participant uuid,
  shift uuid,
  time text,
  to_do boolean
);
comment on table app.event is 'Bubble type event (Event)';
create trigger event_updated_at before update on app.event for each row execute function app.set_updated_at();

create table app.feedback (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  behalf text,
  date_signed timestamptz,
  email text,
  feedback text,
  help_details text,
  comms text,
  name text,
  outcome text,
  participant uuid,
  phone text,
  signature text
);
comment on table app.feedback is 'Bubble type feedback (Feedback)';
create trigger feedback_updated_at before update on app.feedback for each row execute function app.set_updated_at();

create table app.first_aid (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  expiry timestamptz,
  first_aid_certificate text
);
comment on table app.first_aid is 'Bubble type first_aid (First Aid)';
create trigger first_aid_updated_at before update on app.first_aid for each row execute function app.set_updated_at();

create table app.food_fluid (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  comment text,
  food_fluid text,
  meal text,
  name text,
  quantity text
);
comment on table app.food_fluid is 'Bubble type food_fluid (Food Fluid)';
create trigger food_fluid_updated_at before update on app.food_fluid for each row execute function app.set_updated_at();

create table app.handbook (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  hg10 boolean,
  hg11 boolean,
  hg12 boolean,
  hg13 boolean,
  hg14 boolean,
  hg15 boolean,
  hg1 boolean,
  hg2 boolean,
  hg3 boolean,
  hg4 boolean,
  hg5 boolean,
  hg6 boolean,
  hg7 boolean,
  hg8 boolean default false,
  hg9 boolean
);
comment on table app.handbook is 'Bubble type handbook (Handbook)';
create trigger handbook_updated_at before update on app.handbook for each row execute function app.set_updated_at();

create table app.health_profile (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  allergies text,
  behaviour_support_plan text,
  doctor_address jsonb,
  doctor_clinic text,
  doctor_name text,
  doctor_phone text,
  emergency_contact_name_one text,
  emergency_contact_name_two text,
  emergency_contact_phone_one text,
  emergency_contact_phone_two text,
  emergency_contact_relationship_one text,
  emergency_contact_relationship_two text,
  hospital_admissions text,
  last_hospital_stay_length text,
  medications text,
  mental_health text[],
  mental_health_other text,
  ndis_primary_diagnosis text,
  ndis_secondary_diagnosis text,
  participant uuid,
  pharmacist_name text,
  pharmacist_phone text,
  pharmacy_address jsonb,
  physical_health text[],
  physical_health_other text
);
comment on table app.health_profile is 'Bubble type health_profile (Health Profile)';
create trigger health_profile_updated_at before update on app.health_profile for each row execute function app.set_updated_at();

create table app.home_safety (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  bathroom_access text,
  bathroom_drainage text,
  bathroom_ventilation text,
  bed_height text,
  bed_space text,
  cleaning_products text,
  cleaning_products_storage text,
  clothesline text,
  dangerous_visitors text,
  door_access text,
  doors_locked text,
  electrical_equipment text,
  electrical_leads text,
  exposed_gas_cylinders text,
  faulty_smoke_detectors text,
  floor_surfaces text,
  food_prep_equipment text,
  fridge_freezer text,
  furniture_placement text,
  gates text,
  hoarding text,
  home_safety_notes text,
  infectious_disease text,
  laundry_drainage text,
  laundry_ventilation text,
  lighting text,
  manual_handling text,
  parking text,
  participant uuid,
  pathway_garden text,
  pests text,
  pets text,
  portable_heaters text,
  power_points_near_water text,
  power_points text,
  restraint_used text,
  room_to_move text,
  smoker_in_home text,
  stairs text,
  stove text,
  switches_plugs text,
  tables_chairs text,
  vacuum text,
  verandah text,
  walking_aid_access text,
  washer_dryer text,
  weapons text
);
comment on table app.home_safety is 'Bubble type home_safety (Home Safety)';
create trigger home_safety_updated_at before update on app.home_safety for each row execute function app.set_updated_at();

create table app.id1 (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  citizenship text,
  insurance text,
  license text,
  passport text
);
comment on table app.id1 is 'Bubble type id1 (ID)';
create trigger id1_updated_at before update on app.id1 for each row execute function app.set_updated_at();

create table app.incident (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  agencies_reported text,
  carer uuid,
  future_prevention text,
  incident_date timestamptz,
  incident_description text,
  incident_harm text,
  incident_location text,
  incident_management text,
  incident_resolution text,
  incident_type text,
  injury_location text,
  injury_nature text,
  investigation_outcome text,
  ndis_reported_date timestamptz,
  ndis_reported text,
  not_ndis text,
  participant_feedback text,
  participant uuid,
  preventable_incident text,
  reportable_type text,
  reportable_yes_no text,
  safety_actions text,
  team_informed text,
  team_informed_date timestamptz,
  witnesses text
);
comment on table app.incident is 'Bubble type incident (Incident)';
create trigger incident_updated_at before update on app.incident for each row execute function app.set_updated_at();

create table app.info_book (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  participant_signature text,
  participant uuid,
  representative_signature text,
  representative text,
  signed_date timestamptz
);
comment on table app.info_book is 'Bubble type info_book (Info Book)';
create trigger info_book_updated_at before update on app.info_book for each row execute function app.set_updated_at();

create table app.intake_form (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  aboriginal text,
  allergies text,
  assist_by text,
  bsp text,
  carer_language text,
  carer_personality text,
  carer_skills text,
  carer_training text,
  communication_type text,
  consent text[],
  contact1address jsonb,
  contact1advocacyform text,
  contact1email text,
  contact1phone text,
  contact1relation text,
  contact2address jsonb,
  contact2advocacyform text,
  contact2email text,
  contact2phone text,
  contact2relation text,
  contact1name text,
  contact1 text,
  contact2name text,
  contact2 text,
  cultural_values text,
  carer_culture text,
  dairy text,
  diagnosis text,
  diet_requirements text,
  dont_eat text,
  favourite_food text,
  gender text,
  gluten text,
  goals text,
  hobbies text,
  hospital_admission_assistance text,
  hospital_admission_history text,
  interpreter text,
  knightingale_signature text,
  language text,
  legal_issues text,
  living_situation text,
  manual_handling text[],
  medication_assistance text,
  medications text,
  mental_health text[],
  mental_medications text,
  mobility text[],
  ndis_funding text,
  other_info text,
  outcomes text,
  participant_signature text,
  participant uuid,
  personal_care text[],
  physical_health text[],
  physical_medications text,
  plan_manager uuid,
  communication_method text,
  primary_diagnosis text,
  religion text,
  representative_signature text,
  secondary_diagnosis text,
  services text[],
  signature_date timestamptz,
  carer_age text,
  carer_gender text,
  support_needs text,
  twelve_month_goals text,
  unique_you text,
  vegan text,
  vegetarian text
);
comment on table app.intake_form is 'Bubble type intake_form (Intake)';
create trigger intake_form_updated_at before update on app.intake_form for each row execute function app.set_updated_at();

create table app.interests (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  animal text,
  carer uuid,
  education text,
  fav_foods text,
  film text,
  hobbies text,
  music text,
  musical_genre text,
  past_story text,
  pets text,
  skills text,
  sport text,
  team text,
  tv_film text,
  why_care text
);
comment on table app.interests is 'Bubble type interests (Interests)';
create trigger interests_updated_at before update on app.interests for each row execute function app.set_updated_at();

create table app.invoice (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  amount numeric,
  period_ending timestamptz,
  invoice_file text,
  invoice_image text,
  invoice_name uuid,
  invoice_number text,
  location uuid,
  participant uuid,
  status boolean
);
comment on table app.invoice is 'Bubble type invoice (Invoice)';
create trigger invoice_updated_at before update on app.invoice for each row execute function app.set_updated_at();

create table app.location1 (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  address jsonb,
  details text,
  email text,
  handbook text,
  invoiced_through_date timestamptz,
  location text,
  name text,
  ndis text,
  beds numeric
);
comment on table app.location1 is 'Bubble type location1 (Locations)';
create trigger location1_updated_at before update on app.location1 for each row execute function app.set_updated_at();

create table app.login (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  location uuid,
  password text,
  username text
);
comment on table app.login is 'Bubble type login (Login)';
create trigger login_updated_at before update on app.login for each row execute function app.set_updated_at();

create table app.medication_chart (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  date timestamptz[],
  meds text,
  participant uuid
);
comment on table app.medication_chart is 'Bubble type medication_chart (Medication Chart)';
create trigger medication_chart_updated_at before update on app.medication_chart for each row execute function app.set_updated_at();

create table app.message (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  attachment text,
  comms_book uuid,
  content text,
  knowledge_base boolean,
  sender text,
  thread uuid
);
comment on table app.message is 'Bubble type message (Message)';
create trigger message_updated_at before update on app.message for each row execute function app.set_updated_at();

create table app.metrics (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  acu_join_bottom numeric,
  acu_join_top numeric,
  acu_landings numeric,
  acu_sign_up numeric,
  graduate_join_bottom numeric,
  graduate_join_top numeric,
  graduate_landings numeric,
  graduate_sign_up text,
  join_bottom numeric,
  join_top numeric,
  landings numeric,
  sign_up numeric,
  user_value uuid
);
comment on table app.metrics is 'Bubble type metrics (Metrics)';
create trigger metrics_updated_at before update on app.metrics for each row execute function app.set_updated_at();

create table app.ndis (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  expiry_date timestamptz,
  id_number text
);
comment on table app.ndis is 'Bubble type ndis (Ndis)';
create trigger ndis_updated_at before update on app.ndis for each row execute function app.set_updated_at();

create table app.ndis_pricing (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer_pay_name text,
  carer_pay numeric,
  hourly_revenue numeric,
  item_name text,
  item_no text,
  item_price numeric
);
comment on table app.ndis_pricing is 'Bubble type ndis_pricing (Ndis Pricing)';
create trigger ndis_pricing_updated_at before update on app.ndis_pricing for each row execute function app.set_updated_at();

create table app.ndis_quarter (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  amount numeric,
  remaining_days numeric,
  days_to_quarter_end numeric,
  end_value timestamptz,
  end_days numeric,
  hours_per_week numeric,
  participant uuid,
  quarter_days numeric,
  quarter numeric,
  rate numeric default 73.58,
  remaining_budget numeric,
  spent numeric,
  start timestamptz
);
comment on table app.ndis_quarter is 'Bubble type ndis_quarter (Ndis quarter)';
create trigger ndis_quarter_updated_at before update on app.ndis_quarter for each row execute function app.set_updated_at();

create table app.payslip (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  address jsonb,
  gross_pay numeric,
  carer uuid,
  hours_worked numeric,
  net_pay numeric,
  pay_period_start timestamptz,
  pay_period_ending timestamptz,
  payment_date timestamptz,
  role text,
  super numeric,
  tax numeric,
  travel numeric,
  ytd_gross numeric,
  ytd_net numeric,
  ytd_tax numeric
);
comment on table app.payslip is 'Bubble type payslip (Payslip)';
create trigger payslip_updated_at before update on app.payslip for each row execute function app.set_updated_at();

create table app.plan_manager (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  address jsonb,
  email text,
  name text,
  phone text
);
comment on table app.plan_manager is 'Bubble type plan_manager (Plan Manager)';
create trigger plan_manager_updated_at before update on app.plan_manager for each row execute function app.set_updated_at();

create table app.police_check (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  expiry_date timestamptz,
  image text,
  passed boolean,
  reference_number text
);
comment on table app.police_check is 'Bubble type police_check (Police Check)';
create trigger police_check_updated_at before update on app.police_check for each row execute function app.set_updated_at();

create table app.progress_notes (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  activities_of_daily_living text,
  ai_analysed boolean,
  ai_status text,
  ai_summary text,
  allied_health text,
  best_day text,
  carer uuid,
  comms text,
  coordinator uuid,
  date timestamptz,
  fluid_intake text,
  food_intake text,
  general_mood text,
  housework text,
  maintenance text,
  medical_appointments text,
  outings text,
  participant uuid,
  pics text[],
  progress_note text,
  shift uuid,
  submit boolean,
  summary text
);
comment on table app.progress_notes is 'Bubble type progress_notes (Progress Note)';
create trigger progress_notes_updated_at before update on app.progress_notes for each row execute function app.set_updated_at();

create table app.qualifications (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  ahpra text[],
  carer uuid,
  expiry timestamptz,
  qualifications text[],
  registration_number text,
  role text[],
  transcript text[]
);
comment on table app.qualifications is 'Bubble type qualifications (Qualifications)';
create trigger qualifications_updated_at before update on app.qualifications for each row execute function app.set_updated_at();

create table app.questionnaire_session (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  call_sid text,
  carer uuid,
  completed timestamptz,
  heads_up_sent timestamptz,
  participant uuid,
  scheduled_call timestamptz,
  section text,
  shift uuid,
  skipped_fields text,
  started timestamptz,
  status text,
  transcript text
);
comment on table app.questionnaire_session is 'Bubble type questionnaire_session (Questionnaire Session)';
create trigger questionnaire_session_updated_at before update on app.questionnaire_session for each row execute function app.set_updated_at();

create table app.quote (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  quote text
);
comment on table app.quote is 'Bubble type quote (Quote)';
create trigger quote_updated_at before update on app.quote for each row execute function app.set_updated_at();

create table app.recurring (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  coordinator uuid,
  day text,
  end_value text,
  hours numeric,
  participant uuid,
  shift uuid,
  start text
);
comment on table app.recurring is 'Bubble type recurring (Recurring)';
create trigger recurring_updated_at before update on app.recurring for each row execute function app.set_updated_at();

create table app.reporting (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  invoice_amount numeric,
  invoice_date timestamptz,
  invoice_number text,
  qualification text,
  rate_per_hour numeric,
  shift uuid,
  shift_date timestamptz,
  end_time text,
  shift_hours numeric,
  start_time text,
  wintringham_site text
);
comment on table app.reporting is 'Bubble type reporting (Reporting)';
create trigger reporting_updated_at before update on app.reporting for each row execute function app.set_updated_at();

create table app.residential_pricings (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer_pay numeric,
  hourly_revenue numeric,
  name text,
  rate numeric
);
comment on table app.residential_pricings is 'Bubble type residential_pricings (Residential Pricings)';
create trigger residential_pricings_updated_at before update on app.residential_pricings for each row execute function app.set_updated_at();

create table app.review (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  client uuid,
  private text,
  public text,
  descriptors text[],
  late_time numeric,
  location uuid,
  on_time boolean,
  rating numeric,
  shift uuid,
  welcome boolean
);
comment on table app.review is 'Bubble type review (Review)';
create trigger review_updated_at before update on app.review for each row execute function app.set_updated_at();

create table app.risk_assessment (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  accidental_movement text[],
  accidental_movement_other text,
  communication text,
  environmental_risks text[],
  environmental_risks_other text,
  financial_risks text[],
  financial_risks_other text,
  health_safety_impact text,
  hr10 boolean,
  hr11 boolean,
  hr12 boolean,
  hr13 boolean,
  hr14 boolean,
  hr15 boolean,
  hr16 boolean,
  hr17 boolean,
  hr18 boolean,
  hr19 boolean,
  dangerous_visitors boolean,
  hr20 boolean,
  hr21 boolean,
  hr22 boolean,
  hr23 boolean,
  hr24 boolean,
  hr25 boolean,
  hr26 boolean,
  hr27 boolean,
  hr28 boolean,
  hr29 boolean,
  hr2 boolean,
  hr30 boolean,
  hr31 boolean,
  hr32 boolean,
  hr33 boolean,
  hr34 boolean,
  hr35 boolean,
  hr36 boolean,
  hr37 boolean,
  hr38 boolean,
  hr39 boolean,
  hr3 boolean,
  hr40 boolean,
  hr41 boolean,
  hr42 boolean,
  hr43 boolean,
  hr44 boolean,
  hr45 boolean,
  hr46 boolean,
  hr47 boolean,
  hr48 boolean,
  hr49 boolean,
  hr4 boolean,
  hr50 boolean,
  hr51 boolean,
  hr52 boolean,
  hr53 boolean,
  hr54 boolean,
  hr55 boolean,
  hr56 boolean,
  hr57 boolean,
  hr58 boolean,
  hr59 boolean,
  hr5 boolean,
  hr6 boolean,
  hr7 boolean,
  hr8 boolean,
  hr9 boolean,
  intake uuid,
  manual_handling text[],
  manual_handling_other text,
  mental_health text[],
  nutrition text[],
  nutrition_other text,
  other_risks text,
  participant_signature text,
  participant uuid,
  personal_care text[],
  personal_contact text,
  persons_involved text,
  physical_health text[],
  physical_mobility text,
  provider_timing text,
  reliance text,
  signature_date timestamptz,
  social_risks text[],
  social_risks_other text,
  sole_worker text,
  substance_use text[],
  substance_use_other text,
  supervision_timing text
);
comment on table app.risk_assessment is 'Bubble type risk_assessment (Risk Assessment)';
create trigger risk_assessment_updated_at before update on app.risk_assessment for each row execute function app.set_updated_at();

create table app.risk_management_plan (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  others text,
  participant uuid,
  participant_impact text,
  person_responsible text,
  review_date timestamptz,
  risk text,
  treatment text
);
comment on table app.risk_management_plan is 'Bubble type risk_management_plan (Risk Management Plan)';
create trigger risk_management_plan_updated_at before update on app.risk_management_plan for each row execute function app.set_updated_at();

create table app.service_agreement (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  participant_signature text,
  participant uuid,
  representative_signature text,
  representative text,
  signed_date timestamptz,
  support_1 uuid,
  support_2 uuid,
  support_3 uuid,
  support_4 uuid,
  support_5 uuid
);
comment on table app.service_agreement is 'Bubble type service_agreement (Service Agreement)';
create trigger service_agreement_updated_at before update on app.service_agreement for each row execute function app.set_updated_at();

create table app.shift (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  abn text default '50405424095',
  accepted boolean default false,
  address jsonb,
  attend_end timestamptz,
  attend_start timestamptz,
  booked_by text,
  cancelled boolean,
  carer uuid,
  check_in_time timestamptz,
  check_out_time timestamptz,
  coordinator uuid,
  csv boolean,
  date timestamptz,
  duties uuid,
  end_time numeric,
  attended boolean default false,
  fee numeric,
  gst_code text default 'P2',
  hours numeric,
  incident uuid,
  invoice uuid,
  invoiced boolean,
  location uuid,
  ndis_pricing uuid,
  needs_invoice boolean,
  notes text,
  participant uuid,
  progress_note uuid,
  rate numeric,
  receipts text[],
  receipts_total numeric,
  recurring text,
  registration text default '4053437425',
  reporting uuid,
  res_pricing uuid,
  revenue numeric,
  roles text[],
  start_time numeric,
  supervisor text,
  time text,
  wage numeric
);
comment on table app.shift is 'Bubble type shift (Shift)';
create trigger shift_updated_at before update on app.shift for each row execute function app.set_updated_at();

create table app.shift_duties (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  done boolean default false,
  duty text,
  participant uuid
);
comment on table app.shift_duties is 'Bubble type shift_duties (Shift Duties)';
create trigger shift_duties_updated_at before update on app.shift_duties for each row execute function app.set_updated_at();

create table app.shift_logs (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  comments text,
  date timestamptz,
  distance numeric,
  done boolean,
  end_location jsonb,
  food_intake text,
  image_after text,
  image_before text,
  invoiced boolean,
  log_type text,
  medication_type text,
  odometer_end numeric,
  odometer_start numeric,
  participant uuid,
  shift uuid,
  start_location jsonb,
  time text
);
comment on table app.shift_logs is 'Bubble type shift_logs (Shift Logs)';
create trigger shift_logs_updated_at before update on app.shift_logs for each row execute function app.set_updated_at();

create table app.shifts_missed (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  date timestamptz,
  location uuid,
  rate uuid,
  reason text,
  shift text
);
comment on table app.shifts_missed is 'Bubble type shifts_missed (Shifts Missed)';
create trigger shifts_missed_updated_at before update on app.shifts_missed for each row execute function app.set_updated_at();

create table app.superannuation (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  fund_acc_name text,
  fund_address jsonb,
  fund_abn text,
  fund_esa text,
  fund_name text,
  member_no text,
  signature text,
  smsf_doc text,
  super_choice text,
  tfn uuid,
  fund_usi text
);
comment on table app.superannuation is 'Bubble type superannuation (Superannuation)';
create trigger superannuation_updated_at before update on app.superannuation for each row execute function app.set_updated_at();

create table app.support_arrangement (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  hours numeric,
  ndis_pricing uuid,
  no numeric,
  participant uuid,
  service_agreement uuid,
  total numeric
);
comment on table app.support_arrangement is 'Bubble type support_arrangement (Support Arrangement)';
create trigger support_arrangement_updated_at before update on app.support_arrangement for each row execute function app.set_updated_at();

create table app.support_plan (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  emerging_health text,
  gp text,
  participant_signature text,
  participant uuid,
  signed_date timestamptz,
  urgent_health text
);
comment on table app.support_plan is 'Bubble type support_plan (Support Plan)';
create trigger support_plan_updated_at before update on app.support_plan for each row execute function app.set_updated_at();

create table app.survey (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  additional_questions text,
  age text,
  comments text,
  complaints text,
  completing_survey text,
  gender text,
  identity text[],
  individual_treatment text,
  location text,
  ndis_hours_weekly text,
  ndis_plan_understanding text,
  ndis_services text[],
  opinion_rating text,
  participant uuid,
  privacy_respect text,
  respect_of_rights text,
  satisfaction text,
  support_based text,
  three_bads text,
  three_changes text,
  three_goods text,
  your_contact text
);
comment on table app.survey is 'Bubble type survey (Survey)';
create trigger survey_updated_at before update on app.survey for each row execute function app.set_updated_at();

create table app.swann (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  date timestamptz,
  email text,
  end_time text,
  location text,
  name text,
  phone_number text,
  platform text,
  start_time text
);
comment on table app.swann is 'Bubble type swann (Swann)';
create trigger swann_updated_at before update on app.swann for each row execute function app.set_updated_at();

create table app.tags (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  tag_name text
);
comment on table app.tags is 'Bubble type tags (Tags)';
create trigger tags_updated_at before update on app.tags for each row execute function app.set_updated_at();

create table app.tax_file_number_declaration (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  student_loan_debt boolean,
  signature text,
  tax_free_threshold boolean,
  tax_file_number text,
  working_rights text
);
comment on table app.tax_file_number_declaration is 'Bubble type tax_file_number_declaration (Tax File Number)';
create trigger tax_file_number_declaration_updated_at before update on app.tax_file_number_declaration for each row execute function app.set_updated_at();

create table app.thread (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  name text
);
comment on table app.thread is 'Bubble type thread (Thread)';
create trigger thread_updated_at before update on app.thread for each row execute function app.set_updated_at();

create table app.unanswered (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  answered boolean,
  question text,
  questioner uuid
);
comment on table app.unanswered is 'Bubble type unanswered (Unanswered)';
create trigger unanswered_updated_at before update on app.unanswered for each row execute function app.set_updated_at();

create table app.vaccinations (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  covid19 text[],
  expiry timestamptz,
  flu text,
  influenza text[]
);
comment on table app.vaccinations is 'Bubble type vaccinations (Vaccinations)';
create trigger vaccinations_updated_at before update on app.vaccinations for each row execute function app.set_updated_at();

create table app.video (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  video text
);
comment on table app.video is 'Bubble type video (Video)';
create trigger video_updated_at before update on app.video for each row execute function app.set_updated_at();

create table app.working_with_children_check (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  approved boolean,
  image text,
  card_number text,
  carer uuid,
  expiry timestamptz,
  state text
);
comment on table app.working_with_children_check is 'Bubble type working_with_children_check (WWCC)';
create trigger working_with_children_check_updated_at before update on app.working_with_children_check for each row execute function app.set_updated_at();

-- Foreign keys (added after all tables exist)
alter table app.event add constraint event_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.esw add constraint esw_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.id1 add constraint id1_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.cpr1 add constraint cpr1_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.ndis add constraint ndis_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.tags add constraint tags_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.users add constraint users_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.calls add constraint calls_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.login add constraint login_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.quote add constraint quote_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.shift add constraint shift_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.swann add constraint swann_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.video add constraint video_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.client add constraint client_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.review add constraint review_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.survey add constraint survey_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.thread add constraint thread_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.consent add constraint consent_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.invoice add constraint invoice_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.message add constraint message_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.metrics add constraint metrics_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.payslip add constraint payslip_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.document add constraint document_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.feedback add constraint feedback_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.handbook add constraint handbook_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.incident add constraint incident_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.first_aid add constraint first_aid_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.info_book add constraint info_book_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.interests add constraint interests_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.location1 add constraint location1_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.recurring add constraint recurring_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.reporting add constraint reporting_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.comms_book add constraint comms_book_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.food_fluid add constraint food_fluid_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.shift_logs add constraint shift_logs_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.unanswered add constraint unanswered_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.home_safety add constraint home_safety_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.intake_form add constraint intake_form_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.availability add constraint availability_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.bank_details add constraint bank_details_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.care_culture add constraint care_culture_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.daily_living add constraint daily_living_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.ndis_pricing add constraint ndis_pricing_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.ndis_quarter add constraint ndis_quarter_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.plan_manager add constraint plan_manager_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.police_check add constraint police_check_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.shift_duties add constraint shift_duties_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.support_plan add constraint support_plan_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.vaccinations add constraint vaccinations_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.shifts_missed add constraint shifts_missed_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.emergency_plan add constraint emergency_plan_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.health_profile add constraint health_profile_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.progress_notes add constraint progress_notes_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.qualifications add constraint qualifications_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.superannuation add constraint superannuation_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.risk_assessment add constraint risk_assessment_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.medication_chart add constraint medication_chart_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.service_agreement add constraint service_agreement_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.support_arrangement add constraint support_arrangement_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.residential_pricings add constraint residential_pricings_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.risk_management_plan add constraint risk_management_plan_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.questionnaire_session add constraint questionnaire_session_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.tax_file_number_declaration add constraint tax_file_number_declaration_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.working_with_children_check add constraint working_with_children_check_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.users add constraint users_bank_details_fkey foreign key (bank_details) references app.bank_details(id) on delete set null;
alter table app.users add constraint users_bsp_fkey foreign key (bsp) references app.users(id) on delete set null;
alter table app.users add constraint users_care_culture_fkey foreign key (care_culture) references app.care_culture(id) on delete set null;
alter table app.users add constraint users_group_chat_fkey foreign key (group_chat) references app.comms_book(id) on delete set null;
alter table app.users add constraint users_consent_fkey foreign key (consent) references app.consent(id) on delete set null;
alter table app.users add constraint users_coordinator_fkey foreign key (coordinator) references app.users(id) on delete set null;
alter table app.users add constraint users_coordinator_2_fkey foreign key (coordinator_2) references app.users(id) on delete set null;
alter table app.users add constraint users_cpr_fkey foreign key (cpr) references app.cpr1(id) on delete set null;
alter table app.users add constraint users_daily_living_fkey foreign key (daily_living) references app.daily_living(id) on delete set null;
alter table app.users add constraint users_emergency_plan_fkey foreign key (emergency_plan) references app.emergency_plan(id) on delete set null;
alter table app.users add constraint users_first_aid_fkey foreign key (first_aid) references app.first_aid(id) on delete set null;
alter table app.users add constraint users_handbook_fkey foreign key (handbook) references app.handbook(id) on delete set null;
alter table app.users add constraint users_health_profile_fkey foreign key (health_profile) references app.health_profile(id) on delete set null;
alter table app.users add constraint users_home_safety_fkey foreign key (home_safety) references app.home_safety(id) on delete set null;
alter table app.users add constraint users_id_document_fkey foreign key (id_document) references app.id1(id) on delete set null;
alter table app.users add constraint users_info_book_fkey foreign key (info_book) references app.info_book(id) on delete set null;
alter table app.users add constraint users_intake_form_fkey foreign key (intake_form) references app.intake_form(id) on delete set null;
alter table app.users add constraint users_interests_fkey foreign key (interests) references app.interests(id) on delete set null;
alter table app.users add constraint users_knowledge_base_fkey foreign key (knowledge_base) references app.thread(id) on delete set null;
alter table app.users add constraint users_medication_chart_fkey foreign key (medication_chart) references app.medication_chart(id) on delete set null;
alter table app.users add constraint users_ndis_fkey foreign key (ndis) references app.ndis(id) on delete set null;
alter table app.users add constraint users_plan_manager_fkey foreign key (plan_manager) references app.plan_manager(id) on delete set null;
alter table app.users add constraint users_police_check_fkey foreign key (police_check) references app.police_check(id) on delete set null;
alter table app.users add constraint users_risk_assessment_fkey foreign key (risk_assessment) references app.risk_assessment(id) on delete set null;
alter table app.users add constraint users_service_agreement_fkey foreign key (service_agreement) references app.service_agreement(id) on delete set null;
alter table app.users add constraint users_superannuation_fkey foreign key (superannuation) references app.superannuation(id) on delete set null;
alter table app.users add constraint users_support_plan_fkey foreign key (support_plan) references app.support_plan(id) on delete set null;
alter table app.users add constraint users_tax_file_number_fkey foreign key (tax_file_number) references app.tax_file_number_declaration(id) on delete set null;
alter table app.users add constraint users_thread_fkey foreign key (thread) references app.thread(id) on delete set null;
alter table app.users add constraint users_vaccinations_fkey foreign key (vaccinations) references app.vaccinations(id) on delete set null;
alter table app.users add constraint users_wwcc_fkey foreign key (wwcc) references app.working_with_children_check(id) on delete set null;
alter table app.availability add constraint availability_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.bank_details add constraint bank_details_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.calls add constraint calls_thread_fkey foreign key (thread) references app.thread(id) on delete set null;
alter table app.care_culture add constraint care_culture_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.client add constraint client_billing_fkey foreign key (billing) references app.users(id) on delete set null;
alter table app.client add constraint client_client_fkey foreign key (client) references app.users(id) on delete set null;
alter table app.comms_book add constraint comms_book_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.consent add constraint consent_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.cpr1 add constraint cpr1_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.daily_living add constraint daily_living_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.document add constraint document_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.emergency_plan add constraint emergency_plan_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.esw add constraint esw_resident_fkey foreign key (resident) references app.users(id) on delete set null;
alter table app.event add constraint event_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.event add constraint event_coordinator_fkey foreign key (coordinator) references app.users(id) on delete set null;
alter table app.event add constraint event_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.event add constraint event_shift_fkey foreign key (shift) references app.shift(id) on delete set null;
alter table app.feedback add constraint feedback_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.first_aid add constraint first_aid_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.handbook add constraint handbook_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.health_profile add constraint health_profile_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.home_safety add constraint home_safety_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.id1 add constraint id1_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.incident add constraint incident_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.incident add constraint incident_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.info_book add constraint info_book_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.intake_form add constraint intake_form_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.intake_form add constraint intake_form_plan_manager_fkey foreign key (plan_manager) references app.plan_manager(id) on delete set null;
alter table app.interests add constraint interests_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.invoice add constraint invoice_invoice_name_fkey foreign key (invoice_name) references app.users(id) on delete set null;
alter table app.invoice add constraint invoice_location_fkey foreign key (location) references app.location1(id) on delete set null;
alter table app.invoice add constraint invoice_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.login add constraint login_location_fkey foreign key (location) references app.location1(id) on delete set null;
alter table app.medication_chart add constraint medication_chart_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.message add constraint message_comms_book_fkey foreign key (comms_book) references app.comms_book(id) on delete set null;
alter table app.message add constraint message_thread_fkey foreign key (thread) references app.thread(id) on delete set null;
alter table app.metrics add constraint metrics_user_value_fkey foreign key (user_value) references app.users(id) on delete set null;
alter table app.ndis add constraint ndis_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.ndis_quarter add constraint ndis_quarter_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.payslip add constraint payslip_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.police_check add constraint police_check_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.progress_notes add constraint progress_notes_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.progress_notes add constraint progress_notes_coordinator_fkey foreign key (coordinator) references app.users(id) on delete set null;
alter table app.progress_notes add constraint progress_notes_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.progress_notes add constraint progress_notes_shift_fkey foreign key (shift) references app.shift(id) on delete set null;
alter table app.qualifications add constraint qualifications_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.questionnaire_session add constraint questionnaire_session_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.questionnaire_session add constraint questionnaire_session_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.questionnaire_session add constraint questionnaire_session_shift_fkey foreign key (shift) references app.shift(id) on delete set null;
alter table app.recurring add constraint recurring_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.recurring add constraint recurring_coordinator_fkey foreign key (coordinator) references app.users(id) on delete set null;
alter table app.recurring add constraint recurring_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.recurring add constraint recurring_shift_fkey foreign key (shift) references app.shift(id) on delete set null;
alter table app.reporting add constraint reporting_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.reporting add constraint reporting_shift_fkey foreign key (shift) references app.shift(id) on delete set null;
alter table app.review add constraint review_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.review add constraint review_client_fkey foreign key (client) references app.users(id) on delete set null;
alter table app.review add constraint review_location_fkey foreign key (location) references app.location1(id) on delete set null;
alter table app.review add constraint review_shift_fkey foreign key (shift) references app.shift(id) on delete set null;
alter table app.risk_assessment add constraint risk_assessment_intake_fkey foreign key (intake) references app.intake_form(id) on delete set null;
alter table app.risk_assessment add constraint risk_assessment_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.risk_management_plan add constraint risk_management_plan_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.service_agreement add constraint service_agreement_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.service_agreement add constraint service_agreement_support_1_fkey foreign key (support_1) references app.support_arrangement(id) on delete set null;
alter table app.service_agreement add constraint service_agreement_support_2_fkey foreign key (support_2) references app.support_arrangement(id) on delete set null;
alter table app.service_agreement add constraint service_agreement_support_3_fkey foreign key (support_3) references app.support_arrangement(id) on delete set null;
alter table app.service_agreement add constraint service_agreement_support_4_fkey foreign key (support_4) references app.support_arrangement(id) on delete set null;
alter table app.service_agreement add constraint service_agreement_support_5_fkey foreign key (support_5) references app.support_arrangement(id) on delete set null;
alter table app.shift add constraint shift_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.shift add constraint shift_coordinator_fkey foreign key (coordinator) references app.users(id) on delete set null;
alter table app.shift add constraint shift_duties_fkey foreign key (duties) references app.shift_duties(id) on delete set null;
alter table app.shift add constraint shift_incident_fkey foreign key (incident) references app.incident(id) on delete set null;
alter table app.shift add constraint shift_invoice_fkey foreign key (invoice) references app.invoice(id) on delete set null;
alter table app.shift add constraint shift_location_fkey foreign key (location) references app.location1(id) on delete set null;
alter table app.shift add constraint shift_ndis_pricing_fkey foreign key (ndis_pricing) references app.ndis_pricing(id) on delete set null;
alter table app.shift add constraint shift_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.shift add constraint shift_progress_note_fkey foreign key (progress_note) references app.progress_notes(id) on delete set null;
alter table app.shift add constraint shift_reporting_fkey foreign key (reporting) references app.reporting(id) on delete set null;
alter table app.shift add constraint shift_res_pricing_fkey foreign key (res_pricing) references app.residential_pricings(id) on delete set null;
alter table app.shift_duties add constraint shift_duties_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.shift_logs add constraint shift_logs_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.shift_logs add constraint shift_logs_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.shift_logs add constraint shift_logs_shift_fkey foreign key (shift) references app.shift(id) on delete set null;
alter table app.shifts_missed add constraint shifts_missed_location_fkey foreign key (location) references app.location1(id) on delete set null;
alter table app.shifts_missed add constraint shifts_missed_rate_fkey foreign key (rate) references app.residential_pricings(id) on delete set null;
alter table app.superannuation add constraint superannuation_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.superannuation add constraint superannuation_tfn_fkey foreign key (tfn) references app.tax_file_number_declaration(id) on delete set null;
alter table app.support_arrangement add constraint support_arrangement_ndis_pricing_fkey foreign key (ndis_pricing) references app.ndis_pricing(id) on delete set null;
alter table app.support_arrangement add constraint support_arrangement_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.support_arrangement add constraint support_arrangement_service_agreement_fkey foreign key (service_agreement) references app.service_agreement(id) on delete set null;
alter table app.support_plan add constraint support_plan_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.survey add constraint survey_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.tax_file_number_declaration add constraint tax_file_number_declaration_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.unanswered add constraint unanswered_questioner_fkey foreign key (questioner) references app.thread(id) on delete set null;
alter table app.vaccinations add constraint vaccinations_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.working_with_children_check add constraint working_with_children_check_carer_fkey foreign key (carer) references app.users(id) on delete set null;

-- Join tables (Bubble list-of-thing fields)
create table app.users_availability (
  users_id uuid not null references app.users(id) on delete cascade,
  availability_id uuid not null references app.availability(id) on delete cascade,
  primary key (users_id, availability_id)
);
comment on table app.users_availability is 'Bubble list field user.availability_list_custom_availability (availability)';
create table app.users_carers (
  owner_id uuid not null references app.users(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (owner_id, users_id)
);
comment on table app.users_carers is 'Bubble list field user.carers_list_user (carers)';
create table app.users_clients (
  owner_id uuid not null references app.users(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (owner_id, users_id)
);
comment on table app.users_clients is 'Bubble list field user.clients_list_user (clients)';
create table app.users_document (
  users_id uuid not null references app.users(id) on delete cascade,
  document_id uuid not null references app.document(id) on delete cascade,
  primary key (users_id, document_id)
);
comment on table app.users_document is 'Bubble list field user.document_list_custom_document (document)';
create table app.users_events (
  users_id uuid not null references app.users(id) on delete cascade,
  event_id uuid not null references app.event(id) on delete cascade,
  primary key (users_id, event_id)
);
comment on table app.users_events is 'Bubble list field user.events_list_custom_event (events)';
create table app.users_incident_reports (
  users_id uuid not null references app.users(id) on delete cascade,
  incident_id uuid not null references app.incident(id) on delete cascade,
  primary key (users_id, incident_id)
);
comment on table app.users_incident_reports is 'Bubble list field user.incident_rerports_list_custom_incident (incident reports)';
create table app.users_locations (
  users_id uuid not null references app.users(id) on delete cascade,
  location1_id uuid not null references app.location1(id) on delete cascade,
  primary key (users_id, location1_id)
);
comment on table app.users_locations is 'Bubble list field user.locations_list_custom_location1 (locations)';
create table app.users_payslips (
  users_id uuid not null references app.users(id) on delete cascade,
  payslip_id uuid not null references app.payslip(id) on delete cascade,
  primary key (users_id, payslip_id)
);
comment on table app.users_payslips is 'Bubble list field user.payslips_list_custom_payslip (payslips)';
create table app.users_qualifications (
  users_id uuid not null references app.users(id) on delete cascade,
  qualifications_id uuid not null references app.qualifications(id) on delete cascade,
  primary key (users_id, qualifications_id)
);
comment on table app.users_qualifications is 'Bubble list field user.qualifications_list_custom_qualifications (qualifications)';
create table app.users_reviews (
  users_id uuid not null references app.users(id) on delete cascade,
  review_id uuid not null references app.review(id) on delete cascade,
  primary key (users_id, review_id)
);
comment on table app.users_reviews is 'Bubble list field user.reviews_list_custom_review (reviews)';
create table app.users_risk_management_plans (
  users_id uuid not null references app.users(id) on delete cascade,
  risk_management_plan_id uuid not null references app.risk_management_plan(id) on delete cascade,
  primary key (users_id, risk_management_plan_id)
);
comment on table app.users_risk_management_plans is 'Bubble list field user.risk_management_plans_list_custom_risk_management_plan (risk management plans)';
create table app.users_shift_duties (
  users_id uuid not null references app.users(id) on delete cascade,
  shift_duties_id uuid not null references app.shift_duties(id) on delete cascade,
  primary key (users_id, shift_duties_id)
);
comment on table app.users_shift_duties is 'Bubble list field user.shift_duties_list_custom_shift_duties (shift duties)';
create table app.users_shifts_accepted (
  users_id uuid not null references app.users(id) on delete cascade,
  shift_id uuid not null references app.shift(id) on delete cascade,
  primary key (users_id, shift_id)
);
comment on table app.users_shifts_accepted is 'Bubble list field user.shifts_list_custom_shift (shifts accepted)';
create table app.users_shifts_missed (
  users_id uuid not null references app.users(id) on delete cascade,
  shifts_missed_id uuid not null references app.shifts_missed(id) on delete cascade,
  primary key (users_id, shifts_missed_id)
);
comment on table app.users_shifts_missed is 'Bubble list field user.shifts_missed_list_custom_shifts_missed (shifts missed)';
create table app.users_shifts_requested (
  users_id uuid not null references app.users(id) on delete cascade,
  shift_id uuid not null references app.shift(id) on delete cascade,
  primary key (users_id, shift_id)
);
comment on table app.users_shifts_requested is 'Bubble list field user.shifts_requested_list_custom_shift (shifts requested)';
create table app.users_unread_messages (
  users_id uuid not null references app.users(id) on delete cascade,
  message_id uuid not null references app.message(id) on delete cascade,
  primary key (users_id, message_id)
);
comment on table app.users_unread_messages is 'Bubble list field user.unread_messages_list_custom_message (unread messages)';
create table app.calls_availability (
  calls_id uuid not null references app.calls(id) on delete cascade,
  availability_id uuid not null references app.availability(id) on delete cascade,
  primary key (calls_id, availability_id)
);
comment on table app.calls_availability is 'Bubble list field calls.availability_list_custom_availability (availability)';
create table app.client_invoices (
  client_id uuid not null references app.client(id) on delete cascade,
  invoice_id uuid not null references app.invoice(id) on delete cascade,
  primary key (client_id, invoice_id)
);
comment on table app.client_invoices is 'Bubble list field client.invoices_list_custom_invoice (Invoices)';
create table app.client_shifts (
  client_id uuid not null references app.client(id) on delete cascade,
  shift_id uuid not null references app.shift(id) on delete cascade,
  primary key (client_id, shift_id)
);
comment on table app.client_shifts is 'Bubble list field client.shifts_list_custom_shift (Shifts)';
create table app.comms_book_unread_messages (
  comms_book_id uuid not null references app.comms_book(id) on delete cascade,
  message_id uuid not null references app.message(id) on delete cascade,
  primary key (comms_book_id, message_id)
);
comment on table app.comms_book_unread_messages is 'Bubble list field comms_book.unread_messages_list_custom_message (unread messages)';
create table app.location1_carers (
  location1_id uuid not null references app.location1(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (location1_id, users_id)
);
comment on table app.location1_carers is 'Bubble list field location1.carers_list_user (carers)';
create table app.location1_clients (
  location1_id uuid not null references app.location1(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (location1_id, users_id)
);
comment on table app.location1_clients is 'Bubble list field location1.clients_list_user (clients)';
create table app.location1_residents (
  location1_id uuid not null references app.location1(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (location1_id, users_id)
);
comment on table app.location1_residents is 'Bubble list field location1.residents_list_user (residents)';
create table app.plan_manager_coordinator (
  plan_manager_id uuid not null references app.plan_manager(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (plan_manager_id, users_id)
);
comment on table app.plan_manager_coordinator is 'Bubble list field plan_manager.coordinator_list_user (coordinator)';
create table app.plan_manager_participants (
  plan_manager_id uuid not null references app.plan_manager(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (plan_manager_id, users_id)
);
comment on table app.plan_manager_participants is 'Bubble list field plan_manager.participants_list_user (participants)';
create table app.review_tags (
  review_id uuid not null references app.review(id) on delete cascade,
  tags_id uuid not null references app.tags(id) on delete cascade,
  primary key (review_id, tags_id)
);
comment on table app.review_tags is 'Bubble list field review.tags_list_custom_tags (tags)';
create table app.risk_assessment_risk_management_plan (
  risk_assessment_id uuid not null references app.risk_assessment(id) on delete cascade,
  risk_management_plan_id uuid not null references app.risk_management_plan(id) on delete cascade,
  primary key (risk_assessment_id, risk_management_plan_id)
);
comment on table app.risk_assessment_risk_management_plan is 'Bubble list field risk_assessment.risk_management_plan_list_custom_risk_management_plan (risk management plan)';
create table app.shift_coordinator (
  shift_id uuid not null references app.shift(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (shift_id, users_id)
);
comment on table app.shift_coordinator is 'Bubble list field shift.coordinator__list_user (coordinator+)';
create table app.shift_events (
  shift_id uuid not null references app.shift(id) on delete cascade,
  event_id uuid not null references app.event(id) on delete cascade,
  primary key (shift_id, event_id)
);
comment on table app.shift_events is 'Bubble list field shift.events_list_custom_event (events)';
create table app.shift_travel (
  shift_id uuid not null references app.shift(id) on delete cascade,
  shift_logs_id uuid not null references app.shift_logs(id) on delete cascade,
  primary key (shift_id, shift_logs_id)
);
comment on table app.shift_travel is 'Bubble list field shift.travel_list_custom_shift_logs (travel)';
create table app.shifts_missed_carers (
  shifts_missed_id uuid not null references app.shifts_missed(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (shifts_missed_id, users_id)
);
comment on table app.shifts_missed_carers is 'Bubble list field shifts_missed.carers_list_user (carers)';
create table app.thread_members (
  thread_id uuid not null references app.thread(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (thread_id, users_id)
);
comment on table app.thread_members is 'Bubble list field thread.members_list_user (members)';

-- Indexes on foreign keys
create index on app.users (bank_details);
create index on app.users (bsp);
create index on app.users (care_culture);
create index on app.users (group_chat);
create index on app.users (consent);
create index on app.users (coordinator);
create index on app.users (coordinator_2);
create index on app.users (cpr);
create index on app.users (daily_living);
create index on app.users (emergency_plan);
create index on app.users (first_aid);
create index on app.users (handbook);
create index on app.users (health_profile);
create index on app.users (home_safety);
create index on app.users (id_document);
create index on app.users (info_book);
create index on app.users (intake_form);
create index on app.users (interests);
create index on app.users (knowledge_base);
create index on app.users (medication_chart);
create index on app.users (ndis);
create index on app.users (plan_manager);
create index on app.users (police_check);
create index on app.users (risk_assessment);
create index on app.users (service_agreement);
create index on app.users (superannuation);
create index on app.users (support_plan);
create index on app.users (tax_file_number);
create index on app.users (thread);
create index on app.users (vaccinations);
create index on app.users (wwcc);
create index on app.availability (carer);
create index on app.bank_details (carer);
create index on app.calls (thread);
create index on app.care_culture (carer);
create index on app.client (billing);
create index on app.client (client);
create index on app.comms_book (participant);
create index on app.consent (participant);
create index on app.cpr1 (carer);
create index on app.daily_living (participant);
create index on app.document (participant);
create index on app.emergency_plan (participant);
create index on app.esw (resident);
create index on app.event (carer);
create index on app.event (coordinator);
create index on app.event (participant);
create index on app.event (shift);
create index on app.feedback (participant);
create index on app.first_aid (carer);
create index on app.handbook (carer);
create index on app.health_profile (participant);
create index on app.home_safety (participant);
create index on app.id1 (carer);
create index on app.incident (carer);
create index on app.incident (participant);
create index on app.info_book (participant);
create index on app.intake_form (participant);
create index on app.intake_form (plan_manager);
create index on app.interests (carer);
create index on app.invoice (invoice_name);
create index on app.invoice (location);
create index on app.invoice (participant);
create index on app.login (location);
create index on app.medication_chart (participant);
create index on app.message (comms_book);
create index on app.message (thread);
create index on app.metrics (user_value);
create index on app.ndis (carer);
create index on app.ndis_quarter (participant);
create index on app.payslip (carer);
create index on app.police_check (carer);
create index on app.progress_notes (carer);
create index on app.progress_notes (coordinator);
create index on app.progress_notes (participant);
create index on app.progress_notes (shift);
create index on app.qualifications (carer);
create index on app.questionnaire_session (carer);
create index on app.questionnaire_session (participant);
create index on app.questionnaire_session (shift);
create index on app.recurring (carer);
create index on app.recurring (coordinator);
create index on app.recurring (participant);
create index on app.recurring (shift);
create index on app.reporting (carer);
create index on app.reporting (shift);
create index on app.review (carer);
create index on app.review (client);
create index on app.review (location);
create index on app.review (shift);
create index on app.risk_assessment (intake);
create index on app.risk_assessment (participant);
create index on app.risk_management_plan (participant);
create index on app.service_agreement (participant);
create index on app.service_agreement (support_1);
create index on app.service_agreement (support_2);
create index on app.service_agreement (support_3);
create index on app.service_agreement (support_4);
create index on app.service_agreement (support_5);
create index on app.shift (carer);
create index on app.shift (coordinator);
create index on app.shift (duties);
create index on app.shift (incident);
create index on app.shift (invoice);
create index on app.shift (location);
create index on app.shift (ndis_pricing);
create index on app.shift (participant);
create index on app.shift (progress_note);
create index on app.shift (reporting);
create index on app.shift (res_pricing);
create index on app.shift_duties (participant);
create index on app.shift_logs (carer);
create index on app.shift_logs (participant);
create index on app.shift_logs (shift);
create index on app.shifts_missed (location);
create index on app.shifts_missed (rate);
create index on app.superannuation (carer);
create index on app.superannuation (tfn);
create index on app.support_arrangement (ndis_pricing);
create index on app.support_arrangement (participant);
create index on app.support_arrangement (service_agreement);
create index on app.support_plan (participant);
create index on app.survey (participant);
create index on app.tax_file_number_declaration (carer);
create index on app.unanswered (questioner);
create index on app.vaccinations (carer);
create index on app.working_with_children_check (carer);

-- Lock everything down; access policies come in a later migration.
do $$ declare r record; begin
  for r in select tablename from pg_tables where schemaname = 'app' loop
    execute format('alter table app.%I enable row level security', r.tablename);
  end loop;
end $$;

comment on column app.users.account_status is 'Bubble user.account_status_boolean';
comment on column app.users.active is 'Bubble user.active_boolean';
comment on column app.users.address is 'Bubble user.address_geographic_address';
comment on column app.users.audit is 'Bubble user.audit_boolean';
comment on column app.users.bank_details is 'Bubble user.bank_details_custom_bank_details (-> bank_details)';
comment on column app.users.bday_text is 'Bubble user.bday_text_text';
comment on column app.users.bsp is 'Bubble user.bsp_user (-> users)';
comment on column app.users.can_drive is 'Bubble user.can_drive_boolean';
comment on column app.users.care_culture is 'Bubble user.care_culture_custom_care_culture (-> care_culture)';
comment on column app.users.client_care_date is 'Bubble user.client_care_date_date';
comment on column app.users.group_chat is 'Bubble user.comms_book_custom_comms_book (-> comms_book)';
comment on column app.users.consent is 'Bubble user.consent_custom_consent (-> consent)';
comment on column app.users.contract_date is 'Bubble user.contract_date_date';
comment on column app.users.contract_signature is 'Bubble user.contract_signature_image';
comment on column app.users.coordinator is 'Bubble user.coordinator__user (-> users)';
comment on column app.users.coordinator_2 is 'Bubble user.coordinator_user (-> users)';
comment on column app.users.cpr is 'Bubble user.cpr_custom_cpr1 (-> cpr1)';
comment on column app.users.current_location is 'Bubble user.current_location_geographic_address';
comment on column app.users.daily_living is 'Bubble user.daily_living_custom_daily_living (-> daily_living)';
comment on column app.users.date_of_birth is 'Bubble user.date_of_birth_date';
comment on column app.users.description is 'Bubble user.description_text';
comment on column app.users.gross_pay is 'Bubble user.earnings_number';
comment on column app.users.emergency_plan is 'Bubble user.emergency_plan_custom_emergency_plan (-> emergency_plan)';
comment on column app.users.first_aid is 'Bubble user.first_aid_custom_first_aid (-> first_aid)';
comment on column app.users.first_name is 'Bubble user.first_name_text';
comment on column app.users.gps_latitude is 'Bubble user.gps_latitude_number';
comment on column app.users.gps_longtitude is 'Bubble user.gps_longtitude_number';
comment on column app.users.handbook is 'Bubble user.handbook_custom_handbook (-> handbook)';
comment on column app.users.health_profile is 'Bubble user.health_profile_custom_health_profile (-> health_profile)';
comment on column app.users.home_safety is 'Bubble user.home_safety_custom_home_safety (-> home_safety)';
comment on column app.users.hours is 'Bubble user.hours_number';
comment on column app.users.id_document is 'Bubble user.id_custom_id1 (-> id1)';
comment on column app.users.info_book is 'Bubble user.info_book_custom_info_book (-> info_book)';
comment on column app.users.intake_form is 'Bubble user.intake_form_custom_intake_form (-> intake_form)';
comment on column app.users.interests is 'Bubble user.interests_custom_interests (-> interests)';
comment on column app.users.knowledge_base is 'Bubble user.knowledge_base_custom_thread (-> thread)';
comment on column app.users.last_name is 'Bubble user.last_name_text';
comment on column app.users.medication_chart is 'Bubble user.medication_chart_custom_medication_chart (-> medication_chart)';
comment on column app.users.middle_name is 'Bubble user.middle_name_text';
comment on column app.users.ndis is 'Bubble user.ndis_custom_ndis (-> ndis)';
comment on column app.users.ndis_induction is 'Bubble user.ndis_induction_file';
comment on column app.users.ndis_number is 'Bubble user.ndis_number_text';
comment on column app.users.net_pay is 'Bubble user.net_earnings_number';
comment on column app.users.notification is 'Bubble user.notification_boolean';
comment on column app.users.phone_number is 'Bubble user.phone_number_text';
comment on column app.users.profile_photo is 'Bubble user.photo_image';
comment on column app.users.plan_end is 'Bubble user.plan_end_date';
comment on column app.users.plan_manager is 'Bubble user.plan_manager_custom_plan_manager (-> plan_manager)';
comment on column app.users.plan_start is 'Bubble user.plan_start_date';
comment on column app.users.police_check is 'Bubble user.police_check_custom_police_check (-> police_check)';
comment on column app.users.priority is 'Bubble user.priority_number';
comment on column app.users.account_type is 'Bubble user.profile_option_profile (option set: profile)';
comment on column app.users.progress_note is 'Bubble user.progress_note1_boolean';
comment on column app.users.rating is 'Bubble user.rating_number';
comment on column app.users.resume is 'Bubble user.resume_file';
comment on column app.users.risk_assessment is 'Bubble user.risk_assessment_custom_risk_assessment (-> risk_assessment)';
comment on column app.users.roles is 'Bubble user.roles_list_option_roles (option set: roles)';
comment on column app.users.room_no is 'Bubble user.room_no___text';
comment on column app.users.service_agreement is 'Bubble user.service_agreement_custom_service_agreement (-> service_agreement)';
comment on column app.users.sex is 'Bubble user.sex_option_sex (option set: sex)';
comment on column app.users.shift_time is 'Bubble user.shift_time_list_option_shift_time (option set: shift_time)';
comment on column app.users.super is 'Bubble user.super_number';
comment on column app.users.superannuation is 'Bubble user.superannuation_custom_superannuation (-> superannuation)';
comment on column app.users.support_plan is 'Bubble user.support_plan_custom_support_plan (-> support_plan)';
comment on column app.users.survey is 'Bubble user.survey_boolean';
comment on column app.users.tax_file_number is 'Bubble user.tax_file_number_custom_tax_file_number_declaration (-> tax_file_number_declaration)';
comment on column app.users.tax is 'Bubble user.tax_number';
comment on column app.users.thread is 'Bubble user.thread_custom_thread (-> thread)';
comment on column app.users.vaccinations is 'Bubble user.vaccinations_custom_vaccinations (-> vaccinations)';
comment on column app.users.website is 'Bubble user.website_text';
comment on column app.users.work_locations is 'Bubble user.work_locations_list_text';
comment on column app.users.wwcc is 'Bubble user.wwcc_custom_working_with_children_check (-> working_with_children_check)';
comment on column app.users.ytd_gross is 'Bubble user.ytd_gross_number';
comment on column app.users.ytd_net is 'Bubble user.ytd_net_number';
comment on column app.users.ytd_tax is 'Bubble user.ytd_tax_number';
comment on column app.availability.accepted is 'Bubble availability.accepted_text';
comment on column app.availability.active is 'Bubble availability.active_boolean';
comment on column app.availability.available is 'Bubble availability.available_boolean';
comment on column app.availability.carer is 'Bubble availability.carer_user (-> users)';
comment on column app.availability.date is 'Bubble availability.date_date';
comment on column app.availability.date_text is 'Bubble availability.date_text_text';
comment on column app.availability.locations is 'Bubble availability.locations_list_text';
comment on column app.availability.nurse_name is 'Bubble availability.nurse_name_text';
comment on column app.availability.nurse_phone is 'Bubble availability.nurse_phone_text';
comment on column app.availability.priority is 'Bubble availability.priority_number';
comment on column app.availability.role is 'Bubble availability.role1_option_roles (option set: roles)';
comment on column app.availability.role_text is 'Bubble availability.role_text_text';
comment on column app.availability.shift is 'Bubble availability.shift1_option_shift_time (option set: shift_time)';
comment on column app.availability.shift_text is 'Bubble availability.shift_text_text';
comment on column app.availability.timeslot is 'Bubble availability.timeslot_text';
comment on column app.availability.weekday is 'Bubble availability.weekday_text';
comment on column app.bank_details.acc_name is 'Bubble bank_details.acc__name_text';
comment on column app.bank_details.acc_no is 'Bubble bank_details.acc__text';
comment on column app.bank_details.bsb_no is 'Bubble bank_details.bsb_text';
comment on column app.bank_details.carer is 'Bubble bank_details.carer_user (-> users)';
comment on column app.bank_details.secure is 'Bubble bank_details.secure_boolean';
comment on column app.calls.date is 'Bubble calls.date_text';
comment on column app.calls.location is 'Bubble calls.location_text';
comment on column app.calls.nurses is 'Bubble calls.nurses_list_text';
comment on column app.calls.shift is 'Bubble calls.shift_text';
comment on column app.calls.status is 'Bubble calls.status_text';
comment on column app.calls.thread is 'Bubble calls.thread_custom_thread (-> thread)';
comment on column app.care_culture.carer is 'Bubble care_culture.carer_user (-> users)';
comment on column app.care_culture.compassion is 'Bubble care_culture.compassion_boolean';
comment on column app.care_culture.future is 'Bubble care_culture.future_boolean';
comment on column app.care_culture.hospitality is 'Bubble care_culture.hospitality_boolean';
comment on column app.care_culture.intro is 'Bubble care_culture.intro_boolean';
comment on column app.care_culture.lifer is 'Bubble care_culture.lifer_boolean';
comment on column app.care_culture.listen is 'Bubble care_culture.listen_boolean';
comment on column app.care_culture.one is 'Bubble care_culture.number_one_boolean';
comment on column app.care_culture.paid is 'Bubble care_culture.paid_boolean';
comment on column app.care_culture.philosophy is 'Bubble care_culture.philosophy_boolean';
comment on column app.care_culture.proactive is 'Bubble care_culture.proactive_boolean';
comment on column app.care_culture.refusals is 'Bubble care_culture.refusals_boolean';
comment on column app.care_culture.to_do_list is 'Bubble care_culture.to_do_list_boolean';
comment on column app.care_culture.trust is 'Bubble care_culture.trust_boolean';
comment on column app.care_culture.trust_video is 'Bubble care_culture.trust_video_text_text';
comment on column app.care_culture.vision is 'Bubble care_culture.vision_boolean';
comment on column app.client.billing_email is 'Bubble client.billing_email_text';
comment on column app.client.billing is 'Bubble client.billing_user (-> users)';
comment on column app.client.client is 'Bubble client.client_user (-> users)';
comment on column app.comms_book.participant is 'Bubble comms_book.participant_user (-> users)';
comment on column app.consent.f_10_sharing is 'Bubble consent.10_sharing_boolean';
comment on column app.consent.f_11_allied is 'Bubble consent.11_allied_boolean';
comment on column app.consent.f_1_audits is 'Bubble consent.1_audits_boolean';
comment on column app.consent.f_2_surveys is 'Bubble consent.2_surveys_boolean';
comment on column app.consent.f_3_ads is 'Bubble consent.3__ads_boolean';
comment on column app.consent.f_4_recruitment is 'Bubble consent.4_recruitment_boolean';
comment on column app.consent.f_5_reporting is 'Bubble consent.5_reporting_boolean';
comment on column app.consent.f_6_training is 'Bubble consent.6_training_boolean';
comment on column app.consent.f_7_marketing is 'Bubble consent.7_marketing_boolean';
comment on column app.consent.f_8_audiovisual is 'Bubble consent.8_audiovisual_boolean';
comment on column app.consent.f_9_photos is 'Bubble consent.9_photos_boolean';
comment on column app.consent.consent_no is 'Bubble consent.consent_no_text';
comment on column app.consent.consent_yes is 'Bubble consent.consent_yes_text';
comment on column app.consent.participant_signature is 'Bubble consent.participant_signature_image';
comment on column app.consent.participant is 'Bubble consent.participant_user (-> users)';
comment on column app.consent.signed_date is 'Bubble consent.signed_date_date';
comment on column app.cpr1.carer is 'Bubble cpr1.carer_user (-> users)';
comment on column app.cpr1.cpr_certificate is 'Bubble cpr1.cpr_certificate_file';
comment on column app.cpr1.expiry is 'Bubble cpr1.expiry_date';
comment on column app.daily_living.carer_pref_age is 'Bubble daily_living.carer_pref_age_text';
comment on column app.daily_living.carer_pref_culture_religion is 'Bubble daily_living.carer_pref_culture_religion_text';
comment on column app.daily_living.carer_pref_gender is 'Bubble daily_living.carer_pref_gender_text';
comment on column app.daily_living.carer_pref_language is 'Bubble daily_living.carer_pref_language_text';
comment on column app.daily_living.carer_pref_personality is 'Bubble daily_living.carer_pref_personality_text';
comment on column app.daily_living.carer_training_required is 'Bubble daily_living.carer_training_required_text';
comment on column app.daily_living.carer_unique_skills is 'Bubble daily_living.carer_unique_skills_text';
comment on column app.daily_living.daily_tasks_assistance is 'Bubble daily_living.daily_tasks_assistance_text';
comment on column app.daily_living.dietary_requirements is 'Bubble daily_living.dietary_requirements_text';
comment on column app.daily_living.foods_disliked is 'Bubble daily_living.foods_disliked_text';
comment on column app.daily_living.foods_liked is 'Bubble daily_living.foods_liked_text';
comment on column app.daily_living.goals_long_term is 'Bubble daily_living.goals_long_term_text';
comment on column app.daily_living.goals_short_term is 'Bubble daily_living.goals_short_term_text';
comment on column app.daily_living.hobbies is 'Bubble daily_living.hobbies_text';
comment on column app.daily_living.living_situation is 'Bubble daily_living.living_situation_text';
comment on column app.daily_living.mobility_aids is 'Bubble daily_living.mobility_aids_text';
comment on column app.daily_living.participant is 'Bubble daily_living.participant_user (-> users)';
comment on column app.daily_living.personal_care is 'Bubble daily_living.personal_care_list_option_personal_care (option set: personal_care)';
comment on column app.daily_living.personal_care_other is 'Bubble daily_living.personal_care_other_text';
comment on column app.daily_living.supports_needed is 'Bubble daily_living.supports_needed_text';
comment on column app.daily_living.unmet_needs is 'Bubble daily_living.unmet_needs_text';
comment on column app.document.audit is 'Bubble document.audit_boolean';
comment on column app.document.doc is 'Bubble document.doc_file';
comment on column app.document.name is 'Bubble document.name_text';
comment on column app.document.participant is 'Bubble document.participant_user (-> users)';
comment on column app.emergency_plan.backup_power is 'Bubble emergency_plan.backup_power_text';
comment on column app.emergency_plan.fire_evacuation is 'Bubble emergency_plan.fire_evacuation_text';
comment on column app.emergency_plan.fire_steps is 'Bubble emergency_plan.fire_steps_text';
comment on column app.emergency_plan.hospital_steps is 'Bubble emergency_plan.hospital_steps_text';
comment on column app.emergency_plan.hospital is 'Bubble emergency_plan.hospital_text';
comment on column app.emergency_plan.infectious_steps is 'Bubble emergency_plan.infectious_steps_text';
comment on column app.emergency_plan.infectious is 'Bubble emergency_plan.infectious_text';
comment on column app.emergency_plan.natural_disaster_steps is 'Bubble emergency_plan.natural_disaster_steps_text';
comment on column app.emergency_plan.natural_disaster is 'Bubble emergency_plan.natural_disaster_text';
comment on column app.emergency_plan.participant_signature is 'Bubble emergency_plan.participant_signature_image';
comment on column app.emergency_plan.participant is 'Bubble emergency_plan.participant_user (-> users)';
comment on column app.emergency_plan.power_outage is 'Bubble emergency_plan.power_outage_text';
comment on column app.emergency_plan.signed_date is 'Bubble emergency_plan.signed_date_date';
comment on column app.emergency_plan.supplies is 'Bubble emergency_plan.supplies_text';
comment on column app.esw.activity_code is 'Bubble esw.activity_code_option_activity (option set: activity)';
comment on column app.esw.date is 'Bubble esw.date_date';
comment on column app.esw.duration is 'Bubble esw.duration_number';
comment on column app.esw.feedback is 'Bubble esw.feedback_text';
comment on column app.esw.offsite is 'Bubble esw.offsite_boolean';
comment on column app.esw.onsite is 'Bubble esw.onsite_boolean';
comment on column app.esw.refusal is 'Bubble esw.refusal_boolean';
comment on column app.esw.resident is 'Bubble esw.resident_user (-> users)';
comment on column app.esw.support_level is 'Bubble esw.support_level_number';
comment on column app.event.address is 'Bubble event.address_geographic_address';
comment on column app.event.carer is 'Bubble event.carer_user (-> users)';
comment on column app.event.coordinator is 'Bubble event.coordinator_user (-> users)';
comment on column app.event.date is 'Bubble event.date_date';
comment on column app.event.details is 'Bubble event.details_text';
comment on column app.event.done is 'Bubble event.done_boolean';
comment on column app.event.notes is 'Bubble event.notes_text';
comment on column app.event.refused is 'Bubble event.refused_boolean';
comment on column app.event.participant is 'Bubble event.resident_user (-> users)';
comment on column app.event.shift is 'Bubble event.shift_custom_shift (-> shift)';
comment on column app.event.time is 'Bubble event.time_text';
comment on column app.event.to_do is 'Bubble event.to_do_boolean';
comment on column app.feedback.behalf is 'Bubble feedback.behalf_text';
comment on column app.feedback.date_signed is 'Bubble feedback.date_signed_date';
comment on column app.feedback.email is 'Bubble feedback.email_text';
comment on column app.feedback.feedback is 'Bubble feedback.feedback_text';
comment on column app.feedback.help_details is 'Bubble feedback.help_details_text';
comment on column app.feedback.comms is 'Bubble feedback.help_text';
comment on column app.feedback.name is 'Bubble feedback.name_text';
comment on column app.feedback.outcome is 'Bubble feedback.outcome_text';
comment on column app.feedback.participant is 'Bubble feedback.participant_user (-> users)';
comment on column app.feedback.phone is 'Bubble feedback.phone_text';
comment on column app.feedback.signature is 'Bubble feedback.signature_image';
comment on column app.first_aid.carer is 'Bubble first_aid.carer_user (-> users)';
comment on column app.first_aid.expiry is 'Bubble first_aid.expiry_date';
comment on column app.first_aid.first_aid_certificate is 'Bubble first_aid.first_aid_certificate_file';
comment on column app.food_fluid.comment is 'Bubble food_fluid.comment_text';
comment on column app.food_fluid.food_fluid is 'Bubble food_fluid.food_fluid_option_food_fluid (option set: food_fluid)';
comment on column app.food_fluid.meal is 'Bubble food_fluid.meal_option_meal (option set: meal)';
comment on column app.food_fluid.name is 'Bubble food_fluid.name_text';
comment on column app.food_fluid.quantity is 'Bubble food_fluid.quantity_option_quantity (option set: quantity)';
comment on column app.handbook.carer is 'Bubble handbook.carer_user (-> users)';
comment on column app.handbook.hg10 is 'Bubble handbook.hg10_boolean';
comment on column app.handbook.hg11 is 'Bubble handbook.hg11_boolean';
comment on column app.handbook.hg12 is 'Bubble handbook.hg12_boolean';
comment on column app.handbook.hg13 is 'Bubble handbook.hg13_boolean';
comment on column app.handbook.hg14 is 'Bubble handbook.hg14_boolean';
comment on column app.handbook.hg15 is 'Bubble handbook.hg15_boolean';
comment on column app.handbook.hg1 is 'Bubble handbook.hg1_boolean';
comment on column app.handbook.hg2 is 'Bubble handbook.hg2_boolean';
comment on column app.handbook.hg3 is 'Bubble handbook.hg3_boolean';
comment on column app.handbook.hg4 is 'Bubble handbook.hg4_boolean';
comment on column app.handbook.hg5 is 'Bubble handbook.hg5_boolean';
comment on column app.handbook.hg6 is 'Bubble handbook.hg6_boolean';
comment on column app.handbook.hg7 is 'Bubble handbook.hg7_boolean';
comment on column app.handbook.hg8 is 'Bubble handbook.hg8_boolean';
comment on column app.handbook.hg9 is 'Bubble handbook.hg9_boolean';
comment on column app.health_profile.allergies is 'Bubble health_profile.allergies_text';
comment on column app.health_profile.behaviour_support_plan is 'Bubble health_profile.behaviour_support_plan_option_answer (option set: answer)';
comment on column app.health_profile.doctor_address is 'Bubble health_profile.doctor_address_geographic_address';
comment on column app.health_profile.doctor_clinic is 'Bubble health_profile.doctor_clinic_text';
comment on column app.health_profile.doctor_name is 'Bubble health_profile.doctor_name_text';
comment on column app.health_profile.doctor_phone is 'Bubble health_profile.doctor_phone_text';
comment on column app.health_profile.emergency_contact_name_one is 'Bubble health_profile.emergency_contact_name_one_text';
comment on column app.health_profile.emergency_contact_name_two is 'Bubble health_profile.emergency_contact_name_two_text';
comment on column app.health_profile.emergency_contact_phone_one is 'Bubble health_profile.emergency_contact_phone_one_text';
comment on column app.health_profile.emergency_contact_phone_two is 'Bubble health_profile.emergency_contact_phone_two_text';
comment on column app.health_profile.emergency_contact_relationship_one is 'Bubble health_profile.emergency_contact_relationship_one_text';
comment on column app.health_profile.emergency_contact_relationship_two is 'Bubble health_profile.emergency_contact_relationship_two_text';
comment on column app.health_profile.hospital_admissions is 'Bubble health_profile.hospital_admissions_text';
comment on column app.health_profile.last_hospital_stay_length is 'Bubble health_profile.last_hospital_stay_length_text';
comment on column app.health_profile.medications is 'Bubble health_profile.medications_text';
comment on column app.health_profile.mental_health is 'Bubble health_profile.mental_health_list_option_mental_health (option set: mental_health)';
comment on column app.health_profile.mental_health_other is 'Bubble health_profile.mental_health_other_text';
comment on column app.health_profile.ndis_primary_diagnosis is 'Bubble health_profile.ndis_primary_diagnosis_text';
comment on column app.health_profile.ndis_secondary_diagnosis is 'Bubble health_profile.ndis_secondary_diagnosis_text';
comment on column app.health_profile.participant is 'Bubble health_profile.participant_user (-> users)';
comment on column app.health_profile.pharmacist_name is 'Bubble health_profile.pharmacist_name_text';
comment on column app.health_profile.pharmacist_phone is 'Bubble health_profile.pharmacist_phone_text';
comment on column app.health_profile.pharmacy_address is 'Bubble health_profile.pharmacy_address_geographic_address';
comment on column app.health_profile.physical_health is 'Bubble health_profile.physical_health_list_option_physical_health (option set: physical_health)';
comment on column app.health_profile.physical_health_other is 'Bubble health_profile.physical_health_other_text';
comment on column app.home_safety.bathroom_access is 'Bubble home_safety.bathroom_access_option_safety_check (option set: safety_check)';
comment on column app.home_safety.bathroom_drainage is 'Bubble home_safety.bathroom_drainage_option_safety_check (option set: safety_check)';
comment on column app.home_safety.bathroom_ventilation is 'Bubble home_safety.bathroom_ventilation_option_safety_check (option set: safety_check)';
comment on column app.home_safety.bed_height is 'Bubble home_safety.bed_height_option_safety_check (option set: safety_check)';
comment on column app.home_safety.bed_space is 'Bubble home_safety.bed_space_option_safety_check (option set: safety_check)';
comment on column app.home_safety.cleaning_products is 'Bubble home_safety.cleaning_products_option_safety_check (option set: safety_check)';
comment on column app.home_safety.cleaning_products_storage is 'Bubble home_safety.cleaning_products_storage_option_safety_check (option set: safety_check)';
comment on column app.home_safety.clothesline is 'Bubble home_safety.clothesline_option_safety_check (option set: safety_check)';
comment on column app.home_safety.dangerous_visitors is 'Bubble home_safety.dangerous_visitors_option_answer (option set: answer)';
comment on column app.home_safety.door_access is 'Bubble home_safety.door_access_option_safety_check (option set: safety_check)';
comment on column app.home_safety.doors_locked is 'Bubble home_safety.doors_locked_option_answer (option set: answer)';
comment on column app.home_safety.electrical_equipment is 'Bubble home_safety.electrical_equipment_option_safety_check (option set: safety_check)';
comment on column app.home_safety.electrical_leads is 'Bubble home_safety.electrical_leads_option_safety_check (option set: safety_check)';
comment on column app.home_safety.exposed_gas_cylinders is 'Bubble home_safety.exposed_gas_cylinders_option_answer (option set: answer)';
comment on column app.home_safety.faulty_smoke_detectors is 'Bubble home_safety.faulty_smoke_detectors_option_answer (option set: answer)';
comment on column app.home_safety.floor_surfaces is 'Bubble home_safety.floor_surfaces_option_safety_check (option set: safety_check)';
comment on column app.home_safety.food_prep_equipment is 'Bubble home_safety.food_prep_equipment_option_safety_check (option set: safety_check)';
comment on column app.home_safety.fridge_freezer is 'Bubble home_safety.fridge_freezer_option_safety_check (option set: safety_check)';
comment on column app.home_safety.furniture_placement is 'Bubble home_safety.furniture_placement_option_safety_check (option set: safety_check)';
comment on column app.home_safety.gates is 'Bubble home_safety.gates_option_safety_check (option set: safety_check)';
comment on column app.home_safety.hoarding is 'Bubble home_safety.hoarding_option_answer (option set: answer)';
comment on column app.home_safety.home_safety_notes is 'Bubble home_safety.home_safety_notes_text';
comment on column app.home_safety.infectious_disease is 'Bubble home_safety.infectious_disease_option_answer (option set: answer)';
comment on column app.home_safety.laundry_drainage is 'Bubble home_safety.laundry_drainage_option_safety_check (option set: safety_check)';
comment on column app.home_safety.laundry_ventilation is 'Bubble home_safety.laundry_ventilation_option_safety_check (option set: safety_check)';
comment on column app.home_safety.lighting is 'Bubble home_safety.lighting_option_safety_check (option set: safety_check)';
comment on column app.home_safety.manual_handling is 'Bubble home_safety.manual_handling_option_safety_check (option set: safety_check)';
comment on column app.home_safety.parking is 'Bubble home_safety.parking_option_safety_check (option set: safety_check)';
comment on column app.home_safety.participant is 'Bubble home_safety.participant_user (-> users)';
comment on column app.home_safety.pathway_garden is 'Bubble home_safety.pathway_garden_option_safety_check (option set: safety_check)';
comment on column app.home_safety.pests is 'Bubble home_safety.pests_option_answer (option set: answer)';
comment on column app.home_safety.pets is 'Bubble home_safety.pets_option_answer (option set: answer)';
comment on column app.home_safety.portable_heaters is 'Bubble home_safety.portable_heaters_option_safety_check (option set: safety_check)';
comment on column app.home_safety.power_points_near_water is 'Bubble home_safety.power_points_near_water_option_answer (option set: answer)';
comment on column app.home_safety.power_points is 'Bubble home_safety.power_points_option_safety_check (option set: safety_check)';
comment on column app.home_safety.restraint_used is 'Bubble home_safety.restraint_used_option_answer (option set: answer)';
comment on column app.home_safety.room_to_move is 'Bubble home_safety.room_to_move_option_safety_check (option set: safety_check)';
comment on column app.home_safety.smoker_in_home is 'Bubble home_safety.smoker_in_home_option_answer (option set: answer)';
comment on column app.home_safety.stairs is 'Bubble home_safety.stairs_option_safety_check (option set: safety_check)';
comment on column app.home_safety.stove is 'Bubble home_safety.stove_option_safety_check (option set: safety_check)';
comment on column app.home_safety.switches_plugs is 'Bubble home_safety.switches_plugs_option_safety_check (option set: safety_check)';
comment on column app.home_safety.tables_chairs is 'Bubble home_safety.tables_chairs_option_safety_check (option set: safety_check)';
comment on column app.home_safety.vacuum is 'Bubble home_safety.vacuum_option_safety_check (option set: safety_check)';
comment on column app.home_safety.verandah is 'Bubble home_safety.verandah_option_safety_check (option set: safety_check)';
comment on column app.home_safety.walking_aid_access is 'Bubble home_safety.walking_aid_access_option_safety_check (option set: safety_check)';
comment on column app.home_safety.washer_dryer is 'Bubble home_safety.washer_dryer_option_safety_check (option set: safety_check)';
comment on column app.home_safety.weapons is 'Bubble home_safety.weapons_option_answer (option set: answer)';
comment on column app.id1.carer is 'Bubble id1.carer_user (-> users)';
comment on column app.id1.citizenship is 'Bubble id1.citizenship_file';
comment on column app.id1.insurance is 'Bubble id1.insurance_file';
comment on column app.id1.license is 'Bubble id1.license_file';
comment on column app.id1.passport is 'Bubble id1.passport_file';
comment on column app.incident.agencies_reported is 'Bubble incident.agencies_reported_text';
comment on column app.incident.carer is 'Bubble incident.carer_user (-> users)';
comment on column app.incident.future_prevention is 'Bubble incident.future_prevention_text';
comment on column app.incident.incident_date is 'Bubble incident.incident_date_date';
comment on column app.incident.incident_description is 'Bubble incident.incident_description_text';
comment on column app.incident.incident_harm is 'Bubble incident.incident_harm_text';
comment on column app.incident.incident_location is 'Bubble incident.incident_location_text';
comment on column app.incident.incident_management is 'Bubble incident.incident_management_text';
comment on column app.incident.incident_resolution is 'Bubble incident.incident_resolution_text';
comment on column app.incident.incident_type is 'Bubble incident.incident_type_text';
comment on column app.incident.injury_location is 'Bubble incident.injury_location_text';
comment on column app.incident.injury_nature is 'Bubble incident.injury_nature_text';
comment on column app.incident.investigation_outcome is 'Bubble incident.investigation_outcome_text';
comment on column app.incident.ndis_reported_date is 'Bubble incident.ndis_reported_date_date';
comment on column app.incident.ndis_reported is 'Bubble incident.ndis_reported_text';
comment on column app.incident.not_ndis is 'Bubble incident.not_ndis_text';
comment on column app.incident.participant_feedback is 'Bubble incident.participant_feedback_text';
comment on column app.incident.participant is 'Bubble incident.participant_user (-> users)';
comment on column app.incident.preventable_incident is 'Bubble incident.preventable_incident_text';
comment on column app.incident.reportable_type is 'Bubble incident.reportable__type__text';
comment on column app.incident.reportable_yes_no is 'Bubble incident.reportable__yes_no__text';
comment on column app.incident.safety_actions is 'Bubble incident.safety_actions1_text';
comment on column app.incident.team_informed is 'Bubble incident.team_informed1_text';
comment on column app.incident.team_informed_date is 'Bubble incident.team_informed_date_date';
comment on column app.incident.witnesses is 'Bubble incident.witnesses_text';
comment on column app.info_book.participant_signature is 'Bubble info_book.participant_signature_image';
comment on column app.info_book.participant is 'Bubble info_book.participant_user (-> users)';
comment on column app.info_book.representative_signature is 'Bubble info_book.representative_signature_image';
comment on column app.info_book.representative is 'Bubble info_book.representative_text';
comment on column app.info_book.signed_date is 'Bubble info_book.signed_date_date';
comment on column app.intake_form.aboriginal is 'Bubble intake_form.aboriginal_text';
comment on column app.intake_form.allergies is 'Bubble intake_form.allergies_text';
comment on column app.intake_form.assist_by is 'Bubble intake_form.assist_by_text';
comment on column app.intake_form.bsp is 'Bubble intake_form.bsp_text';
comment on column app.intake_form.carer_language is 'Bubble intake_form.carer_language_text';
comment on column app.intake_form.carer_personality is 'Bubble intake_form.carer_personality_text';
comment on column app.intake_form.carer_skills is 'Bubble intake_form.carer_skills_text';
comment on column app.intake_form.carer_training is 'Bubble intake_form.carer_training_text';
comment on column app.intake_form.communication_type is 'Bubble intake_form.communication_type_option_communication_type (option set: communication_type)';
comment on column app.intake_form.consent is 'Bubble intake_form.consent_list_option_participation_consent (option set: participation_consent)';
comment on column app.intake_form.contact1address is 'Bubble intake_form.contact1address_geographic_address';
comment on column app.intake_form.contact1advocacyform is 'Bubble intake_form.contact1advocacyform_text';
comment on column app.intake_form.contact1email is 'Bubble intake_form.contact1email_text';
comment on column app.intake_form.contact1phone is 'Bubble intake_form.contact1phone_text';
comment on column app.intake_form.contact1relation is 'Bubble intake_form.contact1relation_text';
comment on column app.intake_form.contact2address is 'Bubble intake_form.contact2address_geographic_address';
comment on column app.intake_form.contact2advocacyform is 'Bubble intake_form.contact2advocacyform_text';
comment on column app.intake_form.contact2email is 'Bubble intake_form.contact2email_text';
comment on column app.intake_form.contact2phone is 'Bubble intake_form.contact2phone_text';
comment on column app.intake_form.contact2relation is 'Bubble intake_form.contact2relation_text';
comment on column app.intake_form.contact1name is 'Bubble intake_form.contact_one_1_text';
comment on column app.intake_form.contact1 is 'Bubble intake_form.contact_one_option_contact (option set: contact)';
comment on column app.intake_form.contact2name is 'Bubble intake_form.contact_two_2_text';
comment on column app.intake_form.contact2 is 'Bubble intake_form.contact_two_option_contact (option set: contact)';
comment on column app.intake_form.cultural_values is 'Bubble intake_form.cultural_values_text';
comment on column app.intake_form.carer_culture is 'Bubble intake_form.culture_text';
comment on column app.intake_form.dairy is 'Bubble intake_form.dairy_text';
comment on column app.intake_form.diagnosis is 'Bubble intake_form.diagnosis_text';
comment on column app.intake_form.diet_requirements is 'Bubble intake_form.diet_requirements_text';
comment on column app.intake_form.dont_eat is 'Bubble intake_form.dont_eat_text';
comment on column app.intake_form.favourite_food is 'Bubble intake_form.favourite_food_text';
comment on column app.intake_form.gender is 'Bubble intake_form.gender_text';
comment on column app.intake_form.gluten is 'Bubble intake_form.gluten_text';
comment on column app.intake_form.goals is 'Bubble intake_form.goals_text';
comment on column app.intake_form.hobbies is 'Bubble intake_form.hobbies_text';
comment on column app.intake_form.hospital_admission_assistance is 'Bubble intake_form.hospital_admission_assistance_text';
comment on column app.intake_form.hospital_admission_history is 'Bubble intake_form.hospital_admission_history_text';
comment on column app.intake_form.interpreter is 'Bubble intake_form.interpreter_text';
comment on column app.intake_form.knightingale_signature is 'Bubble intake_form.knightingale_signature_image';
comment on column app.intake_form.language is 'Bubble intake_form.language_text';
comment on column app.intake_form.legal_issues is 'Bubble intake_form.legal_issues_text';
comment on column app.intake_form.living_situation is 'Bubble intake_form.living_situation_option_living_situation (option set: living_situation)';
comment on column app.intake_form.manual_handling is 'Bubble intake_form.manual_handling_list_option_manual_handling (option set: manual_handling)';
comment on column app.intake_form.medication_assistance is 'Bubble intake_form.medication_assistance_text';
comment on column app.intake_form.medications is 'Bubble intake_form.medications_text';
comment on column app.intake_form.mental_health is 'Bubble intake_form.mental_health_list_option_mental_health (option set: mental_health)';
comment on column app.intake_form.mental_medications is 'Bubble intake_form.mental_medications_text';
comment on column app.intake_form.mobility is 'Bubble intake_form.mobility_list_option_mobility (option set: mobility)';
comment on column app.intake_form.ndis_funding is 'Bubble intake_form.ndis_funding_option_ndis_funding (option set: ndis_funding)';
comment on column app.intake_form.other_info is 'Bubble intake_form.other_info_text';
comment on column app.intake_form.outcomes is 'Bubble intake_form.outcomes_text';
comment on column app.intake_form.participant_signature is 'Bubble intake_form.participant_signature_image';
comment on column app.intake_form.participant is 'Bubble intake_form.participant_user (-> users)';
comment on column app.intake_form.personal_care is 'Bubble intake_form.personal_care_list_option_personal_care (option set: personal_care)';
comment on column app.intake_form.physical_health is 'Bubble intake_form.physical_health_list_option_physical_health (option set: physical_health)';
comment on column app.intake_form.physical_medications is 'Bubble intake_form.physical_medications_text';
comment on column app.intake_form.plan_manager is 'Bubble intake_form.plan_manager_custom_plan_manager (-> plan_manager)';
comment on column app.intake_form.communication_method is 'Bubble intake_form.preferred_communication_option_communication_method (option set: communication_method)';
comment on column app.intake_form.primary_diagnosis is 'Bubble intake_form.primary_diagnosis_text';
comment on column app.intake_form.religion is 'Bubble intake_form.religion_text';
comment on column app.intake_form.representative_signature is 'Bubble intake_form.representative_signature_image';
comment on column app.intake_form.secondary_diagnosis is 'Bubble intake_form.secondary_diagnosis_text';
comment on column app.intake_form.services is 'Bubble intake_form.services_list_option_service_required (option set: service_required)';
comment on column app.intake_form.signature_date is 'Bubble intake_form.signature_date_date';
comment on column app.intake_form.carer_age is 'Bubble intake_form.staff_age_text';
comment on column app.intake_form.carer_gender is 'Bubble intake_form.staff_gender_option_sex (option set: sex)';
comment on column app.intake_form.support_needs is 'Bubble intake_form.support_needs_text';
comment on column app.intake_form.twelve_month_goals is 'Bubble intake_form.twelve_month_goals_text';
comment on column app.intake_form.unique_you is 'Bubble intake_form.unique_you_text';
comment on column app.intake_form.vegan is 'Bubble intake_form.vegan_text';
comment on column app.intake_form.vegetarian is 'Bubble intake_form.vegetarian_text';
comment on column app.interests.animal is 'Bubble interests.animal_text';
comment on column app.interests.carer is 'Bubble interests.carer_user (-> users)';
comment on column app.interests.education is 'Bubble interests.education_text';
comment on column app.interests.fav_foods is 'Bubble interests.fav_foods_text';
comment on column app.interests.film is 'Bubble interests.film_text';
comment on column app.interests.hobbies is 'Bubble interests.hobbies_text';
comment on column app.interests.music is 'Bubble interests.music_text';
comment on column app.interests.musical_genre is 'Bubble interests.musical_genre_text';
comment on column app.interests.past_story is 'Bubble interests.past_story_text';
comment on column app.interests.pets is 'Bubble interests.pets_text';
comment on column app.interests.skills is 'Bubble interests.skills_text';
comment on column app.interests.sport is 'Bubble interests.sport_text';
comment on column app.interests.team is 'Bubble interests.team_text';
comment on column app.interests.tv_film is 'Bubble interests.tv_film_text';
comment on column app.interests.why_care is 'Bubble interests.why_care_text';
comment on column app.invoice.amount is 'Bubble invoice.amount_number';
comment on column app.invoice.period_ending is 'Bubble invoice.date_date';
comment on column app.invoice.invoice_file is 'Bubble invoice.invoice_file_file';
comment on column app.invoice.invoice_image is 'Bubble invoice.invoice_image_file';
comment on column app.invoice.invoice_name is 'Bubble invoice.invoice_name_user (-> users)';
comment on column app.invoice.invoice_number is 'Bubble invoice.invoice_number_text';
comment on column app.invoice.location is 'Bubble invoice.location_custom_location1 (-> location1)';
comment on column app.invoice.participant is 'Bubble invoice.participant_user (-> users)';
comment on column app.invoice.status is 'Bubble invoice.status_boolean';
comment on column app.location1.address is 'Bubble location1.address_geographic_address';
comment on column app.location1.details is 'Bubble location1.details_text';
comment on column app.location1.email is 'Bubble location1.email_text';
comment on column app.location1.handbook is 'Bubble location1.handbook_file';
comment on column app.location1.invoiced_through_date is 'Bubble location1.invoiced_through_date_date';
comment on column app.location1.location is 'Bubble location1.location_option_location0 (option set: location0)';
comment on column app.location1.name is 'Bubble location1.name_text';
comment on column app.location1.ndis is 'Bubble location1.ndis__text';
comment on column app.location1.beds is 'Bubble location1.no_of_residents_number';
comment on column app.login.location is 'Bubble login.location_custom_location1 (-> location1)';
comment on column app.login.password is 'Bubble login.password_text';
comment on column app.login.username is 'Bubble login.username_text';
comment on column app.medication_chart.date is 'Bubble medication_chart.date_list_date';
comment on column app.medication_chart.meds is 'Bubble medication_chart.meds_text';
comment on column app.medication_chart.participant is 'Bubble medication_chart.participant_user (-> users)';
comment on column app.message.attachment is 'Bubble message.attachment_file';
comment on column app.message.comms_book is 'Bubble message.comms_book_custom_comms_book (-> comms_book)';
comment on column app.message.content is 'Bubble message.content_text';
comment on column app.message.knowledge_base is 'Bubble message.knowledge_base_boolean';
comment on column app.message.sender is 'Bubble message.sender_text';
comment on column app.message.thread is 'Bubble message.thread_custom_thread (-> thread)';
comment on column app.metrics.acu_join_bottom is 'Bubble metrics.acu_join_bottom_number';
comment on column app.metrics.acu_join_top is 'Bubble metrics.acu_join_top_number';
comment on column app.metrics.acu_landings is 'Bubble metrics.acu_landings_number';
comment on column app.metrics.acu_sign_up is 'Bubble metrics.acu_sign_up_number';
comment on column app.metrics.graduate_join_bottom is 'Bubble metrics.graduate_join_bottom_number';
comment on column app.metrics.graduate_join_top is 'Bubble metrics.graduate_join_top_number';
comment on column app.metrics.graduate_landings is 'Bubble metrics.graduate_landings_number';
comment on column app.metrics.graduate_sign_up is 'Bubble metrics.graduate_sign_up_text';
comment on column app.metrics.join_bottom is 'Bubble metrics.join_bottom_number';
comment on column app.metrics.join_top is 'Bubble metrics.join_number';
comment on column app.metrics.landings is 'Bubble metrics.landings_number';
comment on column app.metrics.sign_up is 'Bubble metrics.sign_up_number';
comment on column app.metrics.user_value is 'Bubble metrics.user_user (-> users)';
comment on column app.ndis.carer is 'Bubble ndis.carer_user (-> users)';
comment on column app.ndis.expiry_date is 'Bubble ndis.expiry_date_date';
comment on column app.ndis.id_number is 'Bubble ndis.id_number_text';
comment on column app.ndis_pricing.carer_pay_name is 'Bubble ndis_pricing.carer_pay_name_text';
comment on column app.ndis_pricing.carer_pay is 'Bubble ndis_pricing.carer_pay_number';
comment on column app.ndis_pricing.hourly_revenue is 'Bubble ndis_pricing.hourly_revenue_number';
comment on column app.ndis_pricing.item_name is 'Bubble ndis_pricing.item_name_text';
comment on column app.ndis_pricing.item_no is 'Bubble ndis_pricing.item_no_text';
comment on column app.ndis_pricing.item_price is 'Bubble ndis_pricing.item_price_number';
comment on column app.ndis_quarter.amount is 'Bubble ndis_quarter.amount_number';
comment on column app.ndis_quarter.remaining_days is 'Bubble ndis_quarter.days_remaining_number';
comment on column app.ndis_quarter.days_to_quarter_end is 'Bubble ndis_quarter.days_to_quarter_end_number';
comment on column app.ndis_quarter.end_value is 'Bubble ndis_quarter.end_date';
comment on column app.ndis_quarter.end_days is 'Bubble ndis_quarter.end_days_number';
comment on column app.ndis_quarter.hours_per_week is 'Bubble ndis_quarter.hours_per_shift_number';
comment on column app.ndis_quarter.participant is 'Bubble ndis_quarter.participant_user (-> users)';
comment on column app.ndis_quarter.quarter_days is 'Bubble ndis_quarter.quarter_days_number';
comment on column app.ndis_quarter.quarter is 'Bubble ndis_quarter.quarter_number';
comment on column app.ndis_quarter.rate is 'Bubble ndis_quarter.rate_number';
comment on column app.ndis_quarter.remaining_budget is 'Bubble ndis_quarter.remaining_number';
comment on column app.ndis_quarter.spent is 'Bubble ndis_quarter.spent_number';
comment on column app.ndis_quarter.start is 'Bubble ndis_quarter.start_date';
comment on column app.payslip.address is 'Bubble payslip.address_geographic_address';
comment on column app.payslip.gross_pay is 'Bubble payslip.amount_number';
comment on column app.payslip.carer is 'Bubble payslip.carer_user (-> users)';
comment on column app.payslip.hours_worked is 'Bubble payslip.hours_worked_number';
comment on column app.payslip.net_pay is 'Bubble payslip.net_amount_number';
comment on column app.payslip.pay_period_start is 'Bubble payslip.pat_period_start_date';
comment on column app.payslip.pay_period_ending is 'Bubble payslip.pay_period_ending_date';
comment on column app.payslip.payment_date is 'Bubble payslip.period_ending_date';
comment on column app.payslip.role is 'Bubble payslip.role_option_roles (option set: roles)';
comment on column app.payslip.super is 'Bubble payslip.super_number';
comment on column app.payslip.tax is 'Bubble payslip.tax_number';
comment on column app.payslip.travel is 'Bubble payslip.travel_number';
comment on column app.payslip.ytd_gross is 'Bubble payslip.ytd_gross_number';
comment on column app.payslip.ytd_net is 'Bubble payslip.ytd_net_number';
comment on column app.payslip.ytd_tax is 'Bubble payslip.ytd_tax_number';
comment on column app.plan_manager.address is 'Bubble plan_manager.address1_geographic_address';
comment on column app.plan_manager.email is 'Bubble plan_manager.email_text';
comment on column app.plan_manager.name is 'Bubble plan_manager.name_text';
comment on column app.plan_manager.phone is 'Bubble plan_manager.phone_text';
comment on column app.police_check.carer is 'Bubble police_check.carer_user (-> users)';
comment on column app.police_check.expiry_date is 'Bubble police_check.expiry_date_date';
comment on column app.police_check.image is 'Bubble police_check.image_file';
comment on column app.police_check.passed is 'Bubble police_check.passed_boolean';
comment on column app.police_check.reference_number is 'Bubble police_check.reference_number_text';
comment on column app.progress_notes.activities_of_daily_living is 'Bubble progress_notes.activities_of_daily_living_text';
comment on column app.progress_notes.ai_analysed is 'Bubble progress_notes.ai_analysed_boolean';
comment on column app.progress_notes.ai_status is 'Bubble progress_notes.ai_status_option_ai_status (option set: ai_status)';
comment on column app.progress_notes.ai_summary is 'Bubble progress_notes.ai_summary_text';
comment on column app.progress_notes.allied_health is 'Bubble progress_notes.allied_health_text';
comment on column app.progress_notes.best_day is 'Bubble progress_notes.best_day_text';
comment on column app.progress_notes.carer is 'Bubble progress_notes.carer_user (-> users)';
comment on column app.progress_notes.comms is 'Bubble progress_notes.comms_text';
comment on column app.progress_notes.coordinator is 'Bubble progress_notes.coordinator_user (-> users)';
comment on column app.progress_notes.date is 'Bubble progress_notes.date_date';
comment on column app.progress_notes.fluid_intake is 'Bubble progress_notes.fluid_intake_text';
comment on column app.progress_notes.food_intake is 'Bubble progress_notes.food_intake_text';
comment on column app.progress_notes.general_mood is 'Bubble progress_notes.general_mood_text';
comment on column app.progress_notes.housework is 'Bubble progress_notes.housework_text';
comment on column app.progress_notes.maintenance is 'Bubble progress_notes.maintenance_text';
comment on column app.progress_notes.medical_appointments is 'Bubble progress_notes.medical_appointments_text';
comment on column app.progress_notes.outings is 'Bubble progress_notes.outings_text';
comment on column app.progress_notes.participant is 'Bubble progress_notes.participant_user (-> users)';
comment on column app.progress_notes.pics is 'Bubble progress_notes.pics_list_image';
comment on column app.progress_notes.progress_note is 'Bubble progress_notes.progress_note_text';
comment on column app.progress_notes.shift is 'Bubble progress_notes.shift_custom_shift (-> shift)';
comment on column app.progress_notes.submit is 'Bubble progress_notes.submit_boolean';
comment on column app.progress_notes.summary is 'Bubble progress_notes.summary_text';
comment on column app.qualifications.ahpra is 'Bubble qualifications.ahpra_list_file';
comment on column app.qualifications.carer is 'Bubble qualifications.carer_user (-> users)';
comment on column app.qualifications.expiry is 'Bubble qualifications.expiry_date_date';
comment on column app.qualifications.qualifications is 'Bubble qualifications.qualifications_list_option_skills (option set: skills)';
comment on column app.qualifications.registration_number is 'Bubble qualifications.registration_number_text';
comment on column app.qualifications.role is 'Bubble qualifications.role1_list_option_roles (option set: roles)';
comment on column app.qualifications.transcript is 'Bubble qualifications.transcript_list_file';
comment on column app.questionnaire_session.call_sid is 'Bubble questionnaire_session.call_sid_text';
comment on column app.questionnaire_session.carer is 'Bubble questionnaire_session.carer_user (-> users)';
comment on column app.questionnaire_session.completed is 'Bubble questionnaire_session.completed_date';
comment on column app.questionnaire_session.heads_up_sent is 'Bubble questionnaire_session.heads_up_sent_date';
comment on column app.questionnaire_session.participant is 'Bubble questionnaire_session.participant_user (-> users)';
comment on column app.questionnaire_session.scheduled_call is 'Bubble questionnaire_session.scheduled_call_date';
comment on column app.questionnaire_session.section is 'Bubble questionnaire_session.section_option_questionnaire_section (option set: questionnaire_section)';
comment on column app.questionnaire_session.shift is 'Bubble questionnaire_session.shift_custom_shift (-> shift)';
comment on column app.questionnaire_session.skipped_fields is 'Bubble questionnaire_session.skipped_fields_text';
comment on column app.questionnaire_session.started is 'Bubble questionnaire_session.started_date';
comment on column app.questionnaire_session.status is 'Bubble questionnaire_session.status_option_questionnaire_status (option set: questionnaire_status)';
comment on column app.questionnaire_session.transcript is 'Bubble questionnaire_session.transcript_text';
comment on column app.quote.quote is 'Bubble quote.quote_text';
comment on column app.recurring.carer is 'Bubble recurring.carer_user (-> users)';
comment on column app.recurring.coordinator is 'Bubble recurring.coordinator_user (-> users)';
comment on column app.recurring.day is 'Bubble recurring.day_text';
comment on column app.recurring.end_value is 'Bubble recurring.end_text';
comment on column app.recurring.hours is 'Bubble recurring.hours_number';
comment on column app.recurring.participant is 'Bubble recurring.participant_user (-> users)';
comment on column app.recurring.shift is 'Bubble recurring.shift_custom_shift (-> shift)';
comment on column app.recurring.start is 'Bubble recurring.start_text';
comment on column app.reporting.carer is 'Bubble reporting.carer_user (-> users)';
comment on column app.reporting.invoice_amount is 'Bubble reporting.invoice_amount_number';
comment on column app.reporting.invoice_date is 'Bubble reporting.invoice_date_date';
comment on column app.reporting.invoice_number is 'Bubble reporting.invoice_number_text';
comment on column app.reporting.qualification is 'Bubble reporting.qualification_option_roles (option set: roles)';
comment on column app.reporting.rate_per_hour is 'Bubble reporting.rate_per_hour_number';
comment on column app.reporting.shift is 'Bubble reporting.shift_custom_shift (-> shift)';
comment on column app.reporting.shift_date is 'Bubble reporting.shift_date_date';
comment on column app.reporting.end_time is 'Bubble reporting.shift_end_time_text';
comment on column app.reporting.shift_hours is 'Bubble reporting.shift_hours_number';
comment on column app.reporting.start_time is 'Bubble reporting.shift_start_time_text';
comment on column app.reporting.wintringham_site is 'Bubble reporting.site_text';
comment on column app.residential_pricings.carer_pay is 'Bubble residential_pricings.carer_pay_number';
comment on column app.residential_pricings.hourly_revenue is 'Bubble residential_pricings.hourly_revenue_number';
comment on column app.residential_pricings.name is 'Bubble residential_pricings.name_text';
comment on column app.residential_pricings.rate is 'Bubble residential_pricings.rate_number';
comment on column app.review.carer is 'Bubble review.carer_user (-> users)';
comment on column app.review.client is 'Bubble review.client_user (-> users)';
comment on column app.review.private is 'Bubble review.comment_text';
comment on column app.review.public is 'Bubble review.conduct_to_residents_text';
comment on column app.review.descriptors is 'Bubble review.descriptors_list_text';
comment on column app.review.late_time is 'Bubble review.late_time_number';
comment on column app.review.location is 'Bubble review.location_custom_location1 (-> location1)';
comment on column app.review.on_time is 'Bubble review.on_time_boolean';
comment on column app.review.rating is 'Bubble review.rating_number';
comment on column app.review.shift is 'Bubble review.shift_custom_shift (-> shift)';
comment on column app.review.welcome is 'Bubble review.welcome_boolean';
comment on column app.risk_assessment.accidental_movement is 'Bubble risk_assessment.accidental_movement_list_option_accidental_movement (option set: accidental_movement)';
comment on column app.risk_assessment.accidental_movement_other is 'Bubble risk_assessment.accidental_movement_other_text';
comment on column app.risk_assessment.communication is 'Bubble risk_assessment.communication_text';
comment on column app.risk_assessment.environmental_risks is 'Bubble risk_assessment.environmental_risks_list_option_environmental (option set: environmental)';
comment on column app.risk_assessment.environmental_risks_other is 'Bubble risk_assessment.environmental_risks_other_text';
comment on column app.risk_assessment.financial_risks is 'Bubble risk_assessment.financial_risks_list_option_financial_risks (option set: financial_risks)';
comment on column app.risk_assessment.financial_risks_other is 'Bubble risk_assessment.financial_risks_other_text';
comment on column app.risk_assessment.health_safety_impact is 'Bubble risk_assessment.health_safety_impact_text';
comment on column app.risk_assessment.hr10 is 'Bubble risk_assessment.hr10_boolean';
comment on column app.risk_assessment.hr11 is 'Bubble risk_assessment.hr11_boolean';
comment on column app.risk_assessment.hr12 is 'Bubble risk_assessment.hr12_boolean';
comment on column app.risk_assessment.hr13 is 'Bubble risk_assessment.hr13_boolean';
comment on column app.risk_assessment.hr14 is 'Bubble risk_assessment.hr14_boolean';
comment on column app.risk_assessment.hr15 is 'Bubble risk_assessment.hr15_boolean';
comment on column app.risk_assessment.hr16 is 'Bubble risk_assessment.hr16_boolean';
comment on column app.risk_assessment.hr17 is 'Bubble risk_assessment.hr17_boolean';
comment on column app.risk_assessment.hr18 is 'Bubble risk_assessment.hr18_boolean';
comment on column app.risk_assessment.hr19 is 'Bubble risk_assessment.hr19_boolean';
comment on column app.risk_assessment.dangerous_visitors is 'Bubble risk_assessment.hr1_boolean';
comment on column app.risk_assessment.hr20 is 'Bubble risk_assessment.hr20_boolean';
comment on column app.risk_assessment.hr21 is 'Bubble risk_assessment.hr21_boolean';
comment on column app.risk_assessment.hr22 is 'Bubble risk_assessment.hr22_boolean';
comment on column app.risk_assessment.hr23 is 'Bubble risk_assessment.hr23_boolean';
comment on column app.risk_assessment.hr24 is 'Bubble risk_assessment.hr24_boolean';
comment on column app.risk_assessment.hr25 is 'Bubble risk_assessment.hr25_boolean';
comment on column app.risk_assessment.hr26 is 'Bubble risk_assessment.hr26_boolean';
comment on column app.risk_assessment.hr27 is 'Bubble risk_assessment.hr27_boolean';
comment on column app.risk_assessment.hr28 is 'Bubble risk_assessment.hr28_boolean';
comment on column app.risk_assessment.hr29 is 'Bubble risk_assessment.hr29_boolean';
comment on column app.risk_assessment.hr2 is 'Bubble risk_assessment.hr2_boolean';
comment on column app.risk_assessment.hr30 is 'Bubble risk_assessment.hr30_boolean';
comment on column app.risk_assessment.hr31 is 'Bubble risk_assessment.hr31_boolean';
comment on column app.risk_assessment.hr32 is 'Bubble risk_assessment.hr32_boolean';
comment on column app.risk_assessment.hr33 is 'Bubble risk_assessment.hr33_boolean';
comment on column app.risk_assessment.hr34 is 'Bubble risk_assessment.hr34_boolean';
comment on column app.risk_assessment.hr35 is 'Bubble risk_assessment.hr35_boolean';
comment on column app.risk_assessment.hr36 is 'Bubble risk_assessment.hr36_boolean';
comment on column app.risk_assessment.hr37 is 'Bubble risk_assessment.hr37_boolean';
comment on column app.risk_assessment.hr38 is 'Bubble risk_assessment.hr38_boolean';
comment on column app.risk_assessment.hr39 is 'Bubble risk_assessment.hr39_boolean';
comment on column app.risk_assessment.hr3 is 'Bubble risk_assessment.hr3_boolean';
comment on column app.risk_assessment.hr40 is 'Bubble risk_assessment.hr40_boolean';
comment on column app.risk_assessment.hr41 is 'Bubble risk_assessment.hr41_boolean';
comment on column app.risk_assessment.hr42 is 'Bubble risk_assessment.hr42_boolean';
comment on column app.risk_assessment.hr43 is 'Bubble risk_assessment.hr43_boolean';
comment on column app.risk_assessment.hr44 is 'Bubble risk_assessment.hr44_boolean';
comment on column app.risk_assessment.hr45 is 'Bubble risk_assessment.hr45_boolean';
comment on column app.risk_assessment.hr46 is 'Bubble risk_assessment.hr46_boolean';
comment on column app.risk_assessment.hr47 is 'Bubble risk_assessment.hr47_boolean';
comment on column app.risk_assessment.hr48 is 'Bubble risk_assessment.hr48_boolean';
comment on column app.risk_assessment.hr49 is 'Bubble risk_assessment.hr49_boolean';
comment on column app.risk_assessment.hr4 is 'Bubble risk_assessment.hr4_boolean';
comment on column app.risk_assessment.hr50 is 'Bubble risk_assessment.hr50_boolean';
comment on column app.risk_assessment.hr51 is 'Bubble risk_assessment.hr51_boolean';
comment on column app.risk_assessment.hr52 is 'Bubble risk_assessment.hr52_boolean';
comment on column app.risk_assessment.hr53 is 'Bubble risk_assessment.hr53_boolean';
comment on column app.risk_assessment.hr54 is 'Bubble risk_assessment.hr54_boolean';
comment on column app.risk_assessment.hr55 is 'Bubble risk_assessment.hr55_boolean';
comment on column app.risk_assessment.hr56 is 'Bubble risk_assessment.hr56_boolean';
comment on column app.risk_assessment.hr57 is 'Bubble risk_assessment.hr57_boolean';
comment on column app.risk_assessment.hr58 is 'Bubble risk_assessment.hr58_boolean';
comment on column app.risk_assessment.hr59 is 'Bubble risk_assessment.hr59_boolean';
comment on column app.risk_assessment.hr5 is 'Bubble risk_assessment.hr5_boolean';
comment on column app.risk_assessment.hr6 is 'Bubble risk_assessment.hr6_boolean';
comment on column app.risk_assessment.hr7 is 'Bubble risk_assessment.hr7_boolean';
comment on column app.risk_assessment.hr8 is 'Bubble risk_assessment.hr8_boolean';
comment on column app.risk_assessment.hr9 is 'Bubble risk_assessment.hr9_boolean';
comment on column app.risk_assessment.intake is 'Bubble risk_assessment.intake_custom_intake_form (-> intake_form)';
comment on column app.risk_assessment.manual_handling is 'Bubble risk_assessment.manual_handling_list_option_manual_handling (option set: manual_handling)';
comment on column app.risk_assessment.manual_handling_other is 'Bubble risk_assessment.manual_handling_other_text';
comment on column app.risk_assessment.mental_health is 'Bubble risk_assessment.mental_health_list_option_mental_health (option set: mental_health)';
comment on column app.risk_assessment.nutrition is 'Bubble risk_assessment.nutrition_list_option_nutrition (option set: nutrition)';
comment on column app.risk_assessment.nutrition_other is 'Bubble risk_assessment.nutrition_other_text';
comment on column app.risk_assessment.other_risks is 'Bubble risk_assessment.other_risks_text';
comment on column app.risk_assessment.participant_signature is 'Bubble risk_assessment.participant_signature_image';
comment on column app.risk_assessment.participant is 'Bubble risk_assessment.participant_user (-> users)';
comment on column app.risk_assessment.personal_care is 'Bubble risk_assessment.personal_care_list_option_personal_care (option set: personal_care)';
comment on column app.risk_assessment.personal_contact is 'Bubble risk_assessment.personal_contact_text';
comment on column app.risk_assessment.persons_involved is 'Bubble risk_assessment.persons_involved_text';
comment on column app.risk_assessment.physical_health is 'Bubble risk_assessment.physical_health_list_option_physical_health (option set: physical_health)';
comment on column app.risk_assessment.physical_mobility is 'Bubble risk_assessment.physical_mobility_text';
comment on column app.risk_assessment.provider_timing is 'Bubble risk_assessment.provider_timing_text';
comment on column app.risk_assessment.reliance is 'Bubble risk_assessment.reliance_text';
comment on column app.risk_assessment.signature_date is 'Bubble risk_assessment.signature_date_date';
comment on column app.risk_assessment.social_risks is 'Bubble risk_assessment.social_risks_list_option_social_risks (option set: social_risks)';
comment on column app.risk_assessment.social_risks_other is 'Bubble risk_assessment.social_risks_other_text';
comment on column app.risk_assessment.sole_worker is 'Bubble risk_assessment.sole_worker_text';
comment on column app.risk_assessment.substance_use is 'Bubble risk_assessment.substance_use_list_option_substance_use (option set: substance_use)';
comment on column app.risk_assessment.substance_use_other is 'Bubble risk_assessment.substance_use_other_text';
comment on column app.risk_assessment.supervision_timing is 'Bubble risk_assessment.supervision_timing_text';
comment on column app.risk_management_plan.others is 'Bubble risk_management_plan.others_text';
comment on column app.risk_management_plan.participant is 'Bubble risk_management_plan.participant1_user (-> users)';
comment on column app.risk_management_plan.participant_impact is 'Bubble risk_management_plan.participant_impact_text';
comment on column app.risk_management_plan.person_responsible is 'Bubble risk_management_plan.person_responsible_text';
comment on column app.risk_management_plan.review_date is 'Bubble risk_management_plan.review_date_date';
comment on column app.risk_management_plan.risk is 'Bubble risk_management_plan.risk_text';
comment on column app.risk_management_plan.treatment is 'Bubble risk_management_plan.treatment_text';
comment on column app.service_agreement.participant_signature is 'Bubble service_agreement.participant_signature_image';
comment on column app.service_agreement.participant is 'Bubble service_agreement.participant_user (-> users)';
comment on column app.service_agreement.representative_signature is 'Bubble service_agreement.representative_signature_image';
comment on column app.service_agreement.representative is 'Bubble service_agreement.representative_text';
comment on column app.service_agreement.signed_date is 'Bubble service_agreement.signed_date_date';
comment on column app.service_agreement.support_1 is 'Bubble service_agreement.support_1_custom_support_arrangement (-> support_arrangement)';
comment on column app.service_agreement.support_2 is 'Bubble service_agreement.support_2_custom_support_arrangement (-> support_arrangement)';
comment on column app.service_agreement.support_3 is 'Bubble service_agreement.support_3_custom_support_arrangement (-> support_arrangement)';
comment on column app.service_agreement.support_4 is 'Bubble service_agreement.support_4_custom_support_arrangement (-> support_arrangement)';
comment on column app.service_agreement.support_5 is 'Bubble service_agreement.support_5_custom_support_arrangement (-> support_arrangement)';
comment on column app.shift.abn is 'Bubble shift.abn_text';
comment on column app.shift.accepted is 'Bubble shift.accepted_boolean';
comment on column app.shift.address is 'Bubble shift.address_geographic_address';
comment on column app.shift.attend_end is 'Bubble shift.attend_end_date';
comment on column app.shift.attend_start is 'Bubble shift.attended_time_date';
comment on column app.shift.booked_by is 'Bubble shift.booked_by_text';
comment on column app.shift.cancelled is 'Bubble shift.cancelled_boolean';
comment on column app.shift.carer is 'Bubble shift.carer_user (-> users)';
comment on column app.shift.check_in_time is 'Bubble shift.check_in_time_date';
comment on column app.shift.check_out_time is 'Bubble shift.check_out_time_date';
comment on column app.shift.coordinator is 'Bubble shift.coordinator_user (-> users)';
comment on column app.shift.csv is 'Bubble shift.csv_boolean';
comment on column app.shift.date is 'Bubble shift.date_date';
comment on column app.shift.duties is 'Bubble shift.duties_custom_shift_duties (-> shift_duties)';
comment on column app.shift.end_time is 'Bubble shift.end_time_number';
comment on column app.shift.attended is 'Bubble shift.expired_boolean';
comment on column app.shift.fee is 'Bubble shift.fee_number';
comment on column app.shift.gst_code is 'Bubble shift.gst_code_text';
comment on column app.shift.hours is 'Bubble shift.hours_number';
comment on column app.shift.incident is 'Bubble shift.incident_custom_incident (-> incident)';
comment on column app.shift.invoice is 'Bubble shift.invoice_custom_invoice (-> invoice)';
comment on column app.shift.invoiced is 'Bubble shift.invoiced_boolean';
comment on column app.shift.location is 'Bubble shift.location_custom_location1 (-> location1)';
comment on column app.shift.ndis_pricing is 'Bubble shift.ndis_custom_ndis_pricing (-> ndis_pricing)';
comment on column app.shift.needs_invoice is 'Bubble shift.needs_invoice_boolean';
comment on column app.shift.notes is 'Bubble shift.notes_text';
comment on column app.shift.participant is 'Bubble shift.participant_user (-> users)';
comment on column app.shift.progress_note is 'Bubble shift.progress_note_custom_progress_notes (-> progress_notes)';
comment on column app.shift.rate is 'Bubble shift.rate_number';
comment on column app.shift.receipts is 'Bubble shift.receipts_list_file';
comment on column app.shift.receipts_total is 'Bubble shift.receipts_total_number';
comment on column app.shift.recurring is 'Bubble shift.recurring_text';
comment on column app.shift.registration is 'Bubble shift.registration_text';
comment on column app.shift.reporting is 'Bubble shift.reporting_custom_reporting (-> reporting)';
comment on column app.shift.res_pricing is 'Bubble shift.res_pricing__custom_residential_pricings (-> residential_pricings)';
comment on column app.shift.revenue is 'Bubble shift.revenue_number';
comment on column app.shift.roles is 'Bubble shift.roles_list_option_roles (option set: roles)';
comment on column app.shift.start_time is 'Bubble shift.start_time_number';
comment on column app.shift.supervisor is 'Bubble shift.supervisor_text';
comment on column app.shift.time is 'Bubble shift.time_option_shift_time (option set: shift_time)';
comment on column app.shift.wage is 'Bubble shift.wage_number';
comment on column app.shift_duties.done is 'Bubble shift_duties.done_boolean';
comment on column app.shift_duties.duty is 'Bubble shift_duties.duty1_text';
comment on column app.shift_duties.participant is 'Bubble shift_duties.participant_user (-> users)';
comment on column app.shift_logs.carer is 'Bubble shift_logs.carer_user (-> users)';
comment on column app.shift_logs.comments is 'Bubble shift_logs.comments_text';
comment on column app.shift_logs.date is 'Bubble shift_logs.date_date';
comment on column app.shift_logs.distance is 'Bubble shift_logs.distance_number';
comment on column app.shift_logs.done is 'Bubble shift_logs.done_boolean';
comment on column app.shift_logs.end_location is 'Bubble shift_logs.end_location_geographic_address';
comment on column app.shift_logs.food_intake is 'Bubble shift_logs.food_intake_text';
comment on column app.shift_logs.image_after is 'Bubble shift_logs.image_after_file';
comment on column app.shift_logs.image_before is 'Bubble shift_logs.image_before_file';
comment on column app.shift_logs.invoiced is 'Bubble shift_logs.invoiced_boolean';
comment on column app.shift_logs.log_type is 'Bubble shift_logs.log_type_option_log_type (option set: log_type)';
comment on column app.shift_logs.medication_type is 'Bubble shift_logs.medication_type_text';
comment on column app.shift_logs.odometer_end is 'Bubble shift_logs.odometer_end_number';
comment on column app.shift_logs.odometer_start is 'Bubble shift_logs.odometer_start_number';
comment on column app.shift_logs.participant is 'Bubble shift_logs.participant_user (-> users)';
comment on column app.shift_logs.shift is 'Bubble shift_logs.shift_custom_shift (-> shift)';
comment on column app.shift_logs.start_location is 'Bubble shift_logs.start_location_geographic_address';
comment on column app.shift_logs.time is 'Bubble shift_logs.time_text';
comment on column app.shifts_missed.date is 'Bubble shifts_missed.date_date';
comment on column app.shifts_missed.location is 'Bubble shifts_missed.location_custom_location1 (-> location1)';
comment on column app.shifts_missed.rate is 'Bubble shifts_missed.rate_custom_residential_pricings (-> residential_pricings)';
comment on column app.shifts_missed.reason is 'Bubble shifts_missed.reason_text';
comment on column app.shifts_missed.shift is 'Bubble shifts_missed.shift_option_shift_time (option set: shift_time)';
comment on column app.superannuation.carer is 'Bubble superannuation.carer_user (-> users)';
comment on column app.superannuation.fund_acc_name is 'Bubble superannuation.fund_acc_name_text';
comment on column app.superannuation.fund_address is 'Bubble superannuation.fund_address_geographic_address';
comment on column app.superannuation.fund_abn is 'Bubble superannuation.fund_bsb_text';
comment on column app.superannuation.fund_esa is 'Bubble superannuation.fund_esa_text';
comment on column app.superannuation.fund_name is 'Bubble superannuation.fund_name_text';
comment on column app.superannuation.member_no is 'Bubble superannuation.member_no__text';
comment on column app.superannuation.signature is 'Bubble superannuation.signature_image';
comment on column app.superannuation.smsf_doc is 'Bubble superannuation.smsf_doc_file';
comment on column app.superannuation.super_choice is 'Bubble superannuation.super_choice_text';
comment on column app.superannuation.tfn is 'Bubble superannuation.tfn_custom_tax_file_number_declaration (-> tax_file_number_declaration)';
comment on column app.superannuation.fund_usi is 'Bubble superannuation.usi_text';
comment on column app.support_arrangement.hours is 'Bubble support_arrangement.hours_number';
comment on column app.support_arrangement.ndis_pricing is 'Bubble support_arrangement.ndis_pricing_custom_ndis_pricing (-> ndis_pricing)';
comment on column app.support_arrangement.no is 'Bubble support_arrangement.no___number';
comment on column app.support_arrangement.participant is 'Bubble support_arrangement.participant_user (-> users)';
comment on column app.support_arrangement.service_agreement is 'Bubble support_arrangement.service_agreement_custom_service_agreement (-> service_agreement)';
comment on column app.support_arrangement.total is 'Bubble support_arrangement.total_number';
comment on column app.support_plan.emerging_health is 'Bubble support_plan.emerging_health_text';
comment on column app.support_plan.gp is 'Bubble support_plan.gp_text';
comment on column app.support_plan.participant_signature is 'Bubble support_plan.participant_signature_image';
comment on column app.support_plan.participant is 'Bubble support_plan.participant_user (-> users)';
comment on column app.support_plan.signed_date is 'Bubble support_plan.signed_date_date';
comment on column app.support_plan.urgent_health is 'Bubble support_plan.urgent_health_text';
comment on column app.survey.additional_questions is 'Bubble survey.additional_questions_text';
comment on column app.survey.age is 'Bubble survey.age_text';
comment on column app.survey.comments is 'Bubble survey.comments_text';
comment on column app.survey.complaints is 'Bubble survey.complaints_text';
comment on column app.survey.completing_survey is 'Bubble survey.completing_survey_text';
comment on column app.survey.gender is 'Bubble survey.gender_text';
comment on column app.survey.identity is 'Bubble survey.identity_list_text';
comment on column app.survey.individual_treatment is 'Bubble survey.individual_treatment_text';
comment on column app.survey.location is 'Bubble survey.location_text';
comment on column app.survey.ndis_hours_weekly is 'Bubble survey.ndis_hours_weekly_text';
comment on column app.survey.ndis_plan_understanding is 'Bubble survey.ndis_plan_understanding_text';
comment on column app.survey.ndis_services is 'Bubble survey.ndis_services_list_text';
comment on column app.survey.opinion_rating is 'Bubble survey.opinion_rating_text';
comment on column app.survey.participant is 'Bubble survey.participant_user (-> users)';
comment on column app.survey.privacy_respect is 'Bubble survey.privacy_respect_text';
comment on column app.survey.respect_of_rights is 'Bubble survey.respect_of_rights_text';
comment on column app.survey.satisfaction is 'Bubble survey.satisfaction_text';
comment on column app.survey.support_based is 'Bubble survey.support_based_text';
comment on column app.survey.three_bads is 'Bubble survey.three_bads_text';
comment on column app.survey.three_changes is 'Bubble survey.three_changes_text';
comment on column app.survey.three_goods is 'Bubble survey.three_goods_text';
comment on column app.survey.your_contact is 'Bubble survey.your_contact_text';
comment on column app.swann.date is 'Bubble swann.date_date';
comment on column app.swann.email is 'Bubble swann.email_text';
comment on column app.swann.end_time is 'Bubble swann.end_time_text';
comment on column app.swann.location is 'Bubble swann.location_text';
comment on column app.swann.name is 'Bubble swann.name_text';
comment on column app.swann.phone_number is 'Bubble swann.phone_number_text';
comment on column app.swann.platform is 'Bubble swann.platform_text';
comment on column app.swann.start_time is 'Bubble swann.start_time_text';
comment on column app.tags.tag_name is 'Bubble tags.tag_name_text';
comment on column app.tax_file_number_declaration.carer is 'Bubble tax_file_number_declaration.carer_user (-> users)';
comment on column app.tax_file_number_declaration.student_loan_debt is 'Bubble tax_file_number_declaration.education_loan_debt_boolean';
comment on column app.tax_file_number_declaration.signature is 'Bubble tax_file_number_declaration.signature1_image';
comment on column app.tax_file_number_declaration.tax_free_threshold is 'Bubble tax_file_number_declaration.tax_free_threshold_boolean';
comment on column app.tax_file_number_declaration.tax_file_number is 'Bubble tax_file_number_declaration.tfn_text';
comment on column app.tax_file_number_declaration.working_rights is 'Bubble tax_file_number_declaration.working_rights_text';
comment on column app.thread.name is 'Bubble thread.name_text';
comment on column app.unanswered.answered is 'Bubble unanswered.answered_boolean';
comment on column app.unanswered.question is 'Bubble unanswered.question_text';
comment on column app.unanswered.questioner is 'Bubble unanswered.questioner_custom_thread (-> thread)';
comment on column app.vaccinations.carer is 'Bubble vaccinations.carer_user (-> users)';
comment on column app.vaccinations.covid19 is 'Bubble vaccinations.covid19_list_file';
comment on column app.vaccinations.expiry is 'Bubble vaccinations.expiry_date';
comment on column app.vaccinations.flu is 'Bubble vaccinations.flu_file';
comment on column app.vaccinations.influenza is 'Bubble vaccinations.influenza_list_file';
comment on column app.video.video is 'Bubble video.video_file';
comment on column app.working_with_children_check.approved is 'Bubble working_with_children_check.approved_boolean';
comment on column app.working_with_children_check.image is 'Bubble working_with_children_check.card_image_file';
comment on column app.working_with_children_check.card_number is 'Bubble working_with_children_check.card_number_text';
comment on column app.working_with_children_check.carer is 'Bubble working_with_children_check.carer_user (-> users)';
comment on column app.working_with_children_check.expiry is 'Bubble working_with_children_check.expiry_date';
comment on column app.working_with_children_check.state is 'Bubble working_with_children_check.state_text';
