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

create table app.shift_calls (
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
comment on table app.shift_calls is 'Bubble type calls (Calls)';
create trigger shift_calls_updated_at before update on app.shift_calls for each row execute function app.set_updated_at();

create table app.care_culture_checklists (
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
comment on table app.care_culture_checklists is 'Bubble type care_culture (Care Culture)';
create trigger care_culture_checklists_updated_at before update on app.care_culture_checklists for each row execute function app.set_updated_at();

create table app.billing_clients (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  billing_email text,
  billing uuid,
  client uuid
);
comment on table app.billing_clients is 'Bubble type client (Client)';
create trigger billing_clients_updated_at before update on app.billing_clients for each row execute function app.set_updated_at();

create table app.group_chats (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  participant uuid
);
comment on table app.group_chats is 'Bubble type comms_book (Group Chats)';
create trigger group_chats_updated_at before update on app.group_chats for each row execute function app.set_updated_at();

create table app.consents (
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
comment on table app.consents is 'Bubble type consent (Consent)';
create trigger consents_updated_at before update on app.consents for each row execute function app.set_updated_at();

create table app.cpr_certificates (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  cpr_certificate text,
  expiry timestamptz
);
comment on table app.cpr_certificates is 'Bubble type cpr1 (CPR)';
create trigger cpr_certificates_updated_at before update on app.cpr_certificates for each row execute function app.set_updated_at();

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

create table app.participant_documents (
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
comment on table app.participant_documents is 'Bubble type document (Document)';
create trigger participant_documents_updated_at before update on app.participant_documents for each row execute function app.set_updated_at();

create table app.emergency_plans (
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
comment on table app.emergency_plans is 'Bubble type emergency_plan (Emergency Plan)';
create trigger emergency_plans_updated_at before update on app.emergency_plans for each row execute function app.set_updated_at();

create table app.esw_logs (
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
comment on table app.esw_logs is 'Bubble type esw (Esw)';
create trigger esw_logs_updated_at before update on app.esw_logs for each row execute function app.set_updated_at();

create table app.events (
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
comment on table app.events is 'Bubble type event (Event)';
create trigger events_updated_at before update on app.events for each row execute function app.set_updated_at();

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

create table app.first_aid_certificates (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  expiry timestamptz,
  first_aid_certificate text
);
comment on table app.first_aid_certificates is 'Bubble type first_aid (First Aid)';
create trigger first_aid_certificates_updated_at before update on app.first_aid_certificates for each row execute function app.set_updated_at();

create table app.food_fluid_logs (
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
comment on table app.food_fluid_logs is 'Bubble type food_fluid (Food Fluid)';
create trigger food_fluid_logs_updated_at before update on app.food_fluid_logs for each row execute function app.set_updated_at();

create table app.handbook_acknowledgements (
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
comment on table app.handbook_acknowledgements is 'Bubble type handbook (Handbook)';
create trigger handbook_acknowledgements_updated_at before update on app.handbook_acknowledgements for each row execute function app.set_updated_at();

create table app.health_profiles (
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
comment on table app.health_profiles is 'Bubble type health_profile (Health Profile)';
create trigger health_profiles_updated_at before update on app.health_profiles for each row execute function app.set_updated_at();

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

create table app.identity_documents (
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
comment on table app.identity_documents is 'Bubble type id1 (ID)';
create trigger identity_documents_updated_at before update on app.identity_documents for each row execute function app.set_updated_at();

create table app.incidents (
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
comment on table app.incidents is 'Bubble type incident (Incident)';
create trigger incidents_updated_at before update on app.incidents for each row execute function app.set_updated_at();

create table app.info_book_signoffs (
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
comment on table app.info_book_signoffs is 'Bubble type info_book (Info Book)';
create trigger info_book_signoffs_updated_at before update on app.info_book_signoffs for each row execute function app.set_updated_at();

create table app.intakes (
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
comment on table app.intakes is 'Bubble type intake_form (Intake)';
create trigger intakes_updated_at before update on app.intakes for each row execute function app.set_updated_at();

create table app.carer_interests (
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
comment on table app.carer_interests is 'Bubble type interests (Interests)';
create trigger carer_interests_updated_at before update on app.carer_interests for each row execute function app.set_updated_at();

create table app.invoices (
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
comment on table app.invoices is 'Bubble type invoice (Invoice)';
create trigger invoices_updated_at before update on app.invoices for each row execute function app.set_updated_at();

create table app.locations (
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
comment on table app.locations is 'Bubble type location1 (Locations)';
create trigger locations_updated_at before update on app.locations for each row execute function app.set_updated_at();

create table app.location_logins (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  location uuid,
  password text,
  username text
);
comment on table app.location_logins is 'Bubble type login (Login)';
create trigger location_logins_updated_at before update on app.location_logins for each row execute function app.set_updated_at();

create table app.medication_charts (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  date timestamptz[],
  meds text,
  participant uuid
);
comment on table app.medication_charts is 'Bubble type medication_chart (Medication Chart)';
create trigger medication_charts_updated_at before update on app.medication_charts for each row execute function app.set_updated_at();

create table app.messages (
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
comment on table app.messages is 'Bubble type message (Message)';
create trigger messages_updated_at before update on app.messages for each row execute function app.set_updated_at();

create table app.marketing_metrics (
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
comment on table app.marketing_metrics is 'Bubble type metrics (Metrics)';
create trigger marketing_metrics_updated_at before update on app.marketing_metrics for each row execute function app.set_updated_at();

create table app.ndis_screening_checks (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  carer uuid,
  expiry_date timestamptz,
  id_number text
);
comment on table app.ndis_screening_checks is 'Bubble type ndis (Ndis)';
create trigger ndis_screening_checks_updated_at before update on app.ndis_screening_checks for each row execute function app.set_updated_at();

create table app.ndis_price_items (
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
comment on table app.ndis_price_items is 'Bubble type ndis_pricing (Ndis Pricing)';
create trigger ndis_price_items_updated_at before update on app.ndis_price_items for each row execute function app.set_updated_at();

create table app.ndis_quarters (
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
comment on table app.ndis_quarters is 'Bubble type ndis_quarter (Ndis quarter)';
create trigger ndis_quarters_updated_at before update on app.ndis_quarters for each row execute function app.set_updated_at();

create table app.payslips (
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
comment on table app.payslips is 'Bubble type payslip (Payslip)';
create trigger payslips_updated_at before update on app.payslips for each row execute function app.set_updated_at();

create table app.plan_managers (
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
comment on table app.plan_managers is 'Bubble type plan_manager (Plan Manager)';
create trigger plan_managers_updated_at before update on app.plan_managers for each row execute function app.set_updated_at();

create table app.police_checks (
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
comment on table app.police_checks is 'Bubble type police_check (Police Check)';
create trigger police_checks_updated_at before update on app.police_checks for each row execute function app.set_updated_at();

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

create table app.questionnaire_sessions (
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
comment on table app.questionnaire_sessions is 'Bubble type questionnaire_session (Questionnaire Session)';
create trigger questionnaire_sessions_updated_at before update on app.questionnaire_sessions for each row execute function app.set_updated_at();

create table app.quotes (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  quote text
);
comment on table app.quotes is 'Bubble type quote (Quote)';
create trigger quotes_updated_at before update on app.quotes for each row execute function app.set_updated_at();

create table app.recurring_shifts (
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
comment on table app.recurring_shifts is 'Bubble type recurring (Recurring)';
create trigger recurring_shifts_updated_at before update on app.recurring_shifts for each row execute function app.set_updated_at();

create table app.wintringham_reports (
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
comment on table app.wintringham_reports is 'Bubble type reporting (Reporting)';
create trigger wintringham_reports_updated_at before update on app.wintringham_reports for each row execute function app.set_updated_at();

create table app.residential_prices (
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
comment on table app.residential_prices is 'Bubble type residential_pricings (Residential Pricings)';
create trigger residential_prices_updated_at before update on app.residential_prices for each row execute function app.set_updated_at();

create table app.reviews (
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
comment on table app.reviews is 'Bubble type review (Review)';
create trigger reviews_updated_at before update on app.reviews for each row execute function app.set_updated_at();

create table app.risk_assessments (
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
comment on table app.risk_assessments is 'Bubble type risk_assessment (Risk Assessment)';
create trigger risk_assessments_updated_at before update on app.risk_assessments for each row execute function app.set_updated_at();

create table app.risk_management_plans (
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
comment on table app.risk_management_plans is 'Bubble type risk_management_plan (Risk Management Plan)';
create trigger risk_management_plans_updated_at before update on app.risk_management_plans for each row execute function app.set_updated_at();

create table app.service_agreements (
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
comment on table app.service_agreements is 'Bubble type service_agreement (Service Agreement)';
create trigger service_agreements_updated_at before update on app.service_agreements for each row execute function app.set_updated_at();

create table app.shifts (
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
comment on table app.shifts is 'Bubble type shift (Shift)';
create trigger shifts_updated_at before update on app.shifts for each row execute function app.set_updated_at();

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

create table app.missed_shifts (
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
comment on table app.missed_shifts is 'Bubble type shifts_missed (Shifts Missed)';
create trigger missed_shifts_updated_at before update on app.missed_shifts for each row execute function app.set_updated_at();

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

create table app.support_arrangements (
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
comment on table app.support_arrangements is 'Bubble type support_arrangement (Support Arrangement)';
create trigger support_arrangements_updated_at before update on app.support_arrangements for each row execute function app.set_updated_at();

create table app.support_plans (
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
comment on table app.support_plans is 'Bubble type support_plan (Support Plan)';
create trigger support_plans_updated_at before update on app.support_plans for each row execute function app.set_updated_at();

create table app.participant_surveys (
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
comment on table app.participant_surveys is 'Bubble type survey (Survey)';
create trigger participant_surveys_updated_at before update on app.participant_surveys for each row execute function app.set_updated_at();

create table app.swann_bookings (
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
comment on table app.swann_bookings is 'Bubble type swann (Swann)';
create trigger swann_bookings_updated_at before update on app.swann_bookings for each row execute function app.set_updated_at();

create table app.review_tags (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  tag_name text
);
comment on table app.review_tags is 'Bubble type tags (Tags)';
create trigger review_tags_updated_at before update on app.review_tags for each row execute function app.set_updated_at();

create table app.tfn_declarations (
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
comment on table app.tfn_declarations is 'Bubble type tax_file_number_declaration (Tax File Number)';
create trigger tfn_declarations_updated_at before update on app.tfn_declarations for each row execute function app.set_updated_at();

create table app.threads (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  name text
);
comment on table app.threads is 'Bubble type thread (Thread)';
create trigger threads_updated_at before update on app.threads for each row execute function app.set_updated_at();

create table app.unanswered_questions (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  answered boolean,
  question text,
  questioner uuid
);
comment on table app.unanswered_questions is 'Bubble type unanswered (Unanswered)';
create trigger unanswered_questions_updated_at before update on app.unanswered_questions for each row execute function app.set_updated_at();

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

create table app.videos (
  id uuid primary key default gen_random_uuid(),
  bubble_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  video text
);
comment on table app.videos is 'Bubble type video (Video)';
create trigger videos_updated_at before update on app.videos for each row execute function app.set_updated_at();

create table app.wwcc_checks (
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
comment on table app.wwcc_checks is 'Bubble type working_with_children_check (WWCC)';
create trigger wwcc_checks_updated_at before update on app.wwcc_checks for each row execute function app.set_updated_at();

-- Foreign keys (added after all tables exist)
alter table app.events add constraint events_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.esw_logs add constraint esw_logs_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.identity_documents add constraint identity_documents_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.cpr_certificates add constraint cpr_certificates_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.ndis_screening_checks add constraint ndis_screening_checks_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.review_tags add constraint review_tags_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.users add constraint users_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.shift_calls add constraint shift_calls_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.location_logins add constraint location_logins_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.quotes add constraint quotes_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.shifts add constraint shifts_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.swann_bookings add constraint swann_bookings_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.videos add constraint videos_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.billing_clients add constraint billing_clients_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.reviews add constraint reviews_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.participant_surveys add constraint participant_surveys_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.threads add constraint threads_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.consents add constraint consents_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.invoices add constraint invoices_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.messages add constraint messages_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.marketing_metrics add constraint marketing_metrics_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.payslips add constraint payslips_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.participant_documents add constraint participant_documents_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.feedback add constraint feedback_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.handbook_acknowledgements add constraint handbook_acknowledgements_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.incidents add constraint incidents_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.first_aid_certificates add constraint first_aid_certificates_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.info_book_signoffs add constraint info_book_signoffs_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.carer_interests add constraint carer_interests_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.locations add constraint locations_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.recurring_shifts add constraint recurring_shifts_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.wintringham_reports add constraint wintringham_reports_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.group_chats add constraint group_chats_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.food_fluid_logs add constraint food_fluid_logs_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.shift_logs add constraint shift_logs_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.unanswered_questions add constraint unanswered_questions_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.home_safety add constraint home_safety_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.intakes add constraint intakes_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.availability add constraint availability_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.bank_details add constraint bank_details_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.care_culture_checklists add constraint care_culture_checklists_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.daily_living add constraint daily_living_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.ndis_price_items add constraint ndis_price_items_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.ndis_quarters add constraint ndis_quarters_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.plan_managers add constraint plan_managers_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.police_checks add constraint police_checks_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.shift_duties add constraint shift_duties_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.support_plans add constraint support_plans_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.vaccinations add constraint vaccinations_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.missed_shifts add constraint missed_shifts_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.emergency_plans add constraint emergency_plans_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.health_profiles add constraint health_profiles_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.progress_notes add constraint progress_notes_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.qualifications add constraint qualifications_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.superannuation add constraint superannuation_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.risk_assessments add constraint risk_assessments_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.medication_charts add constraint medication_charts_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.service_agreements add constraint service_agreements_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.support_arrangements add constraint support_arrangements_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.residential_prices add constraint residential_prices_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.risk_management_plans add constraint risk_management_plans_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.questionnaire_sessions add constraint questionnaire_sessions_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.tfn_declarations add constraint tfn_declarations_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.wwcc_checks add constraint wwcc_checks_created_by_fkey foreign key (created_by) references app.users(id) on delete set null;
alter table app.users add constraint users_bank_details_fkey foreign key (bank_details) references app.bank_details(id) on delete set null;
alter table app.users add constraint users_bsp_fkey foreign key (bsp) references app.users(id) on delete set null;
alter table app.users add constraint users_care_culture_fkey foreign key (care_culture) references app.care_culture_checklists(id) on delete set null;
alter table app.users add constraint users_group_chat_fkey foreign key (group_chat) references app.group_chats(id) on delete set null;
alter table app.users add constraint users_consent_fkey foreign key (consent) references app.consents(id) on delete set null;
alter table app.users add constraint users_coordinator_fkey foreign key (coordinator) references app.users(id) on delete set null;
alter table app.users add constraint users_coordinator_2_fkey foreign key (coordinator_2) references app.users(id) on delete set null;
alter table app.users add constraint users_cpr_fkey foreign key (cpr) references app.cpr_certificates(id) on delete set null;
alter table app.users add constraint users_daily_living_fkey foreign key (daily_living) references app.daily_living(id) on delete set null;
alter table app.users add constraint users_emergency_plan_fkey foreign key (emergency_plan) references app.emergency_plans(id) on delete set null;
alter table app.users add constraint users_first_aid_fkey foreign key (first_aid) references app.first_aid_certificates(id) on delete set null;
alter table app.users add constraint users_handbook_fkey foreign key (handbook) references app.handbook_acknowledgements(id) on delete set null;
alter table app.users add constraint users_health_profile_fkey foreign key (health_profile) references app.health_profiles(id) on delete set null;
alter table app.users add constraint users_home_safety_fkey foreign key (home_safety) references app.home_safety(id) on delete set null;
alter table app.users add constraint users_id_document_fkey foreign key (id_document) references app.identity_documents(id) on delete set null;
alter table app.users add constraint users_info_book_fkey foreign key (info_book) references app.info_book_signoffs(id) on delete set null;
alter table app.users add constraint users_intake_form_fkey foreign key (intake_form) references app.intakes(id) on delete set null;
alter table app.users add constraint users_interests_fkey foreign key (interests) references app.carer_interests(id) on delete set null;
alter table app.users add constraint users_knowledge_base_fkey foreign key (knowledge_base) references app.threads(id) on delete set null;
alter table app.users add constraint users_medication_chart_fkey foreign key (medication_chart) references app.medication_charts(id) on delete set null;
alter table app.users add constraint users_ndis_fkey foreign key (ndis) references app.ndis_screening_checks(id) on delete set null;
alter table app.users add constraint users_plan_manager_fkey foreign key (plan_manager) references app.plan_managers(id) on delete set null;
alter table app.users add constraint users_police_check_fkey foreign key (police_check) references app.police_checks(id) on delete set null;
alter table app.users add constraint users_risk_assessment_fkey foreign key (risk_assessment) references app.risk_assessments(id) on delete set null;
alter table app.users add constraint users_service_agreement_fkey foreign key (service_agreement) references app.service_agreements(id) on delete set null;
alter table app.users add constraint users_superannuation_fkey foreign key (superannuation) references app.superannuation(id) on delete set null;
alter table app.users add constraint users_support_plan_fkey foreign key (support_plan) references app.support_plans(id) on delete set null;
alter table app.users add constraint users_tax_file_number_fkey foreign key (tax_file_number) references app.tfn_declarations(id) on delete set null;
alter table app.users add constraint users_thread_fkey foreign key (thread) references app.threads(id) on delete set null;
alter table app.users add constraint users_vaccinations_fkey foreign key (vaccinations) references app.vaccinations(id) on delete set null;
alter table app.users add constraint users_wwcc_fkey foreign key (wwcc) references app.wwcc_checks(id) on delete set null;
alter table app.availability add constraint availability_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.bank_details add constraint bank_details_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.shift_calls add constraint shift_calls_thread_fkey foreign key (thread) references app.threads(id) on delete set null;
alter table app.care_culture_checklists add constraint care_culture_checklists_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.billing_clients add constraint billing_clients_billing_fkey foreign key (billing) references app.users(id) on delete set null;
alter table app.billing_clients add constraint billing_clients_client_fkey foreign key (client) references app.users(id) on delete set null;
alter table app.group_chats add constraint group_chats_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.consents add constraint consents_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.cpr_certificates add constraint cpr_certificates_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.daily_living add constraint daily_living_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.participant_documents add constraint participant_documents_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.emergency_plans add constraint emergency_plans_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.esw_logs add constraint esw_logs_resident_fkey foreign key (resident) references app.users(id) on delete set null;
alter table app.events add constraint events_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.events add constraint events_coordinator_fkey foreign key (coordinator) references app.users(id) on delete set null;
alter table app.events add constraint events_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.events add constraint events_shift_fkey foreign key (shift) references app.shifts(id) on delete set null;
alter table app.feedback add constraint feedback_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.first_aid_certificates add constraint first_aid_certificates_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.handbook_acknowledgements add constraint handbook_acknowledgements_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.health_profiles add constraint health_profiles_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.home_safety add constraint home_safety_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.identity_documents add constraint identity_documents_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.incidents add constraint incidents_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.incidents add constraint incidents_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.info_book_signoffs add constraint info_book_signoffs_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.intakes add constraint intakes_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.intakes add constraint intakes_plan_manager_fkey foreign key (plan_manager) references app.plan_managers(id) on delete set null;
alter table app.carer_interests add constraint carer_interests_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.invoices add constraint invoices_invoice_name_fkey foreign key (invoice_name) references app.users(id) on delete set null;
alter table app.invoices add constraint invoices_location_fkey foreign key (location) references app.locations(id) on delete set null;
alter table app.invoices add constraint invoices_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.location_logins add constraint location_logins_location_fkey foreign key (location) references app.locations(id) on delete set null;
alter table app.medication_charts add constraint medication_charts_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.messages add constraint messages_comms_book_fkey foreign key (comms_book) references app.group_chats(id) on delete set null;
alter table app.messages add constraint messages_thread_fkey foreign key (thread) references app.threads(id) on delete set null;
alter table app.marketing_metrics add constraint marketing_metrics_user_value_fkey foreign key (user_value) references app.users(id) on delete set null;
alter table app.ndis_screening_checks add constraint ndis_screening_checks_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.ndis_quarters add constraint ndis_quarters_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.payslips add constraint payslips_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.police_checks add constraint police_checks_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.progress_notes add constraint progress_notes_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.progress_notes add constraint progress_notes_coordinator_fkey foreign key (coordinator) references app.users(id) on delete set null;
alter table app.progress_notes add constraint progress_notes_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.progress_notes add constraint progress_notes_shift_fkey foreign key (shift) references app.shifts(id) on delete set null;
alter table app.qualifications add constraint qualifications_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.questionnaire_sessions add constraint questionnaire_sessions_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.questionnaire_sessions add constraint questionnaire_sessions_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.questionnaire_sessions add constraint questionnaire_sessions_shift_fkey foreign key (shift) references app.shifts(id) on delete set null;
alter table app.recurring_shifts add constraint recurring_shifts_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.recurring_shifts add constraint recurring_shifts_coordinator_fkey foreign key (coordinator) references app.users(id) on delete set null;
alter table app.recurring_shifts add constraint recurring_shifts_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.recurring_shifts add constraint recurring_shifts_shift_fkey foreign key (shift) references app.shifts(id) on delete set null;
alter table app.wintringham_reports add constraint wintringham_reports_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.wintringham_reports add constraint wintringham_reports_shift_fkey foreign key (shift) references app.shifts(id) on delete set null;
alter table app.reviews add constraint reviews_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.reviews add constraint reviews_client_fkey foreign key (client) references app.users(id) on delete set null;
alter table app.reviews add constraint reviews_location_fkey foreign key (location) references app.locations(id) on delete set null;
alter table app.reviews add constraint reviews_shift_fkey foreign key (shift) references app.shifts(id) on delete set null;
alter table app.risk_assessments add constraint risk_assessments_intake_fkey foreign key (intake) references app.intakes(id) on delete set null;
alter table app.risk_assessments add constraint risk_assessments_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.risk_management_plans add constraint risk_management_plans_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.service_agreements add constraint service_agreements_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.service_agreements add constraint service_agreements_support_1_fkey foreign key (support_1) references app.support_arrangements(id) on delete set null;
alter table app.service_agreements add constraint service_agreements_support_2_fkey foreign key (support_2) references app.support_arrangements(id) on delete set null;
alter table app.service_agreements add constraint service_agreements_support_3_fkey foreign key (support_3) references app.support_arrangements(id) on delete set null;
alter table app.service_agreements add constraint service_agreements_support_4_fkey foreign key (support_4) references app.support_arrangements(id) on delete set null;
alter table app.service_agreements add constraint service_agreements_support_5_fkey foreign key (support_5) references app.support_arrangements(id) on delete set null;
alter table app.shifts add constraint shifts_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.shifts add constraint shifts_coordinator_fkey foreign key (coordinator) references app.users(id) on delete set null;
alter table app.shifts add constraint shifts_duties_fkey foreign key (duties) references app.shift_duties(id) on delete set null;
alter table app.shifts add constraint shifts_incident_fkey foreign key (incident) references app.incidents(id) on delete set null;
alter table app.shifts add constraint shifts_invoice_fkey foreign key (invoice) references app.invoices(id) on delete set null;
alter table app.shifts add constraint shifts_location_fkey foreign key (location) references app.locations(id) on delete set null;
alter table app.shifts add constraint shifts_ndis_pricing_fkey foreign key (ndis_pricing) references app.ndis_price_items(id) on delete set null;
alter table app.shifts add constraint shifts_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.shifts add constraint shifts_progress_note_fkey foreign key (progress_note) references app.progress_notes(id) on delete set null;
alter table app.shifts add constraint shifts_reporting_fkey foreign key (reporting) references app.wintringham_reports(id) on delete set null;
alter table app.shifts add constraint shifts_res_pricing_fkey foreign key (res_pricing) references app.residential_prices(id) on delete set null;
alter table app.shift_duties add constraint shift_duties_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.shift_logs add constraint shift_logs_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.shift_logs add constraint shift_logs_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.shift_logs add constraint shift_logs_shift_fkey foreign key (shift) references app.shifts(id) on delete set null;
alter table app.missed_shifts add constraint missed_shifts_location_fkey foreign key (location) references app.locations(id) on delete set null;
alter table app.missed_shifts add constraint missed_shifts_rate_fkey foreign key (rate) references app.residential_prices(id) on delete set null;
alter table app.superannuation add constraint superannuation_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.superannuation add constraint superannuation_tfn_fkey foreign key (tfn) references app.tfn_declarations(id) on delete set null;
alter table app.support_arrangements add constraint support_arrangements_ndis_pricing_fkey foreign key (ndis_pricing) references app.ndis_price_items(id) on delete set null;
alter table app.support_arrangements add constraint support_arrangements_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.support_arrangements add constraint support_arrangements_service_agreement_fkey foreign key (service_agreement) references app.service_agreements(id) on delete set null;
alter table app.support_plans add constraint support_plans_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.participant_surveys add constraint participant_surveys_participant_fkey foreign key (participant) references app.users(id) on delete set null;
alter table app.tfn_declarations add constraint tfn_declarations_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.unanswered_questions add constraint unanswered_questions_questioner_fkey foreign key (questioner) references app.threads(id) on delete set null;
alter table app.vaccinations add constraint vaccinations_carer_fkey foreign key (carer) references app.users(id) on delete set null;
alter table app.wwcc_checks add constraint wwcc_checks_carer_fkey foreign key (carer) references app.users(id) on delete set null;

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
  participant_documents_id uuid not null references app.participant_documents(id) on delete cascade,
  primary key (users_id, participant_documents_id)
);
comment on table app.users_document is 'Bubble list field user.document_list_custom_document (document)';
create table app.users_events (
  users_id uuid not null references app.users(id) on delete cascade,
  events_id uuid not null references app.events(id) on delete cascade,
  primary key (users_id, events_id)
);
comment on table app.users_events is 'Bubble list field user.events_list_custom_event (events)';
create table app.users_incident_reports (
  users_id uuid not null references app.users(id) on delete cascade,
  incidents_id uuid not null references app.incidents(id) on delete cascade,
  primary key (users_id, incidents_id)
);
comment on table app.users_incident_reports is 'Bubble list field user.incident_rerports_list_custom_incident (incident reports)';
create table app.users_locations (
  users_id uuid not null references app.users(id) on delete cascade,
  locations_id uuid not null references app.locations(id) on delete cascade,
  primary key (users_id, locations_id)
);
comment on table app.users_locations is 'Bubble list field user.locations_list_custom_location1 (locations)';
create table app.users_payslips (
  users_id uuid not null references app.users(id) on delete cascade,
  payslips_id uuid not null references app.payslips(id) on delete cascade,
  primary key (users_id, payslips_id)
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
  reviews_id uuid not null references app.reviews(id) on delete cascade,
  primary key (users_id, reviews_id)
);
comment on table app.users_reviews is 'Bubble list field user.reviews_list_custom_review (reviews)';
create table app.users_risk_management_plans (
  users_id uuid not null references app.users(id) on delete cascade,
  risk_management_plans_id uuid not null references app.risk_management_plans(id) on delete cascade,
  primary key (users_id, risk_management_plans_id)
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
  shifts_id uuid not null references app.shifts(id) on delete cascade,
  primary key (users_id, shifts_id)
);
comment on table app.users_shifts_accepted is 'Bubble list field user.shifts_list_custom_shift (shifts accepted)';
create table app.users_shifts_missed (
  users_id uuid not null references app.users(id) on delete cascade,
  missed_shifts_id uuid not null references app.missed_shifts(id) on delete cascade,
  primary key (users_id, missed_shifts_id)
);
comment on table app.users_shifts_missed is 'Bubble list field user.shifts_missed_list_custom_shifts_missed (shifts missed)';
create table app.users_shifts_requested (
  users_id uuid not null references app.users(id) on delete cascade,
  shifts_id uuid not null references app.shifts(id) on delete cascade,
  primary key (users_id, shifts_id)
);
comment on table app.users_shifts_requested is 'Bubble list field user.shifts_requested_list_custom_shift (shifts requested)';
create table app.users_unread_messages (
  users_id uuid not null references app.users(id) on delete cascade,
  messages_id uuid not null references app.messages(id) on delete cascade,
  primary key (users_id, messages_id)
);
comment on table app.users_unread_messages is 'Bubble list field user.unread_messages_list_custom_message (unread messages)';
create table app.shift_calls_availability (
  shift_calls_id uuid not null references app.shift_calls(id) on delete cascade,
  availability_id uuid not null references app.availability(id) on delete cascade,
  primary key (shift_calls_id, availability_id)
);
comment on table app.shift_calls_availability is 'Bubble list field calls.availability_list_custom_availability (availability)';
create table app.billing_clients_invoices (
  billing_clients_id uuid not null references app.billing_clients(id) on delete cascade,
  invoices_id uuid not null references app.invoices(id) on delete cascade,
  primary key (billing_clients_id, invoices_id)
);
comment on table app.billing_clients_invoices is 'Bubble list field client.invoices_list_custom_invoice (Invoices)';
create table app.billing_clients_shifts (
  billing_clients_id uuid not null references app.billing_clients(id) on delete cascade,
  shifts_id uuid not null references app.shifts(id) on delete cascade,
  primary key (billing_clients_id, shifts_id)
);
comment on table app.billing_clients_shifts is 'Bubble list field client.shifts_list_custom_shift (Shifts)';
create table app.group_chats_unread_messages (
  group_chats_id uuid not null references app.group_chats(id) on delete cascade,
  messages_id uuid not null references app.messages(id) on delete cascade,
  primary key (group_chats_id, messages_id)
);
comment on table app.group_chats_unread_messages is 'Bubble list field comms_book.unread_messages_list_custom_message (unread messages)';
create table app.locations_carers (
  locations_id uuid not null references app.locations(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (locations_id, users_id)
);
comment on table app.locations_carers is 'Bubble list field location1.carers_list_user (carers)';
create table app.locations_clients (
  locations_id uuid not null references app.locations(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (locations_id, users_id)
);
comment on table app.locations_clients is 'Bubble list field location1.clients_list_user (clients)';
create table app.locations_residents (
  locations_id uuid not null references app.locations(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (locations_id, users_id)
);
comment on table app.locations_residents is 'Bubble list field location1.residents_list_user (residents)';
create table app.plan_managers_coordinator (
  plan_managers_id uuid not null references app.plan_managers(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (plan_managers_id, users_id)
);
comment on table app.plan_managers_coordinator is 'Bubble list field plan_manager.coordinator_list_user (coordinator)';
create table app.plan_managers_participants (
  plan_managers_id uuid not null references app.plan_managers(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (plan_managers_id, users_id)
);
comment on table app.plan_managers_participants is 'Bubble list field plan_manager.participants_list_user (participants)';
create table app.reviews_tags (
  reviews_id uuid not null references app.reviews(id) on delete cascade,
  review_tags_id uuid not null references app.review_tags(id) on delete cascade,
  primary key (reviews_id, review_tags_id)
);
comment on table app.reviews_tags is 'Bubble list field review.tags_list_custom_tags (tags)';
create table app.risk_assessments_risk_management_plan (
  risk_assessments_id uuid not null references app.risk_assessments(id) on delete cascade,
  risk_management_plans_id uuid not null references app.risk_management_plans(id) on delete cascade,
  primary key (risk_assessments_id, risk_management_plans_id)
);
comment on table app.risk_assessments_risk_management_plan is 'Bubble list field risk_assessment.risk_management_plan_list_custom_risk_management_plan (risk management plan)';
create table app.shifts_coordinator (
  shifts_id uuid not null references app.shifts(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (shifts_id, users_id)
);
comment on table app.shifts_coordinator is 'Bubble list field shift.coordinator__list_user (coordinator+)';
create table app.shifts_events (
  shifts_id uuid not null references app.shifts(id) on delete cascade,
  events_id uuid not null references app.events(id) on delete cascade,
  primary key (shifts_id, events_id)
);
comment on table app.shifts_events is 'Bubble list field shift.events_list_custom_event (events)';
create table app.shifts_travel (
  shifts_id uuid not null references app.shifts(id) on delete cascade,
  shift_logs_id uuid not null references app.shift_logs(id) on delete cascade,
  primary key (shifts_id, shift_logs_id)
);
comment on table app.shifts_travel is 'Bubble list field shift.travel_list_custom_shift_logs (travel)';
create table app.missed_shifts_carers (
  missed_shifts_id uuid not null references app.missed_shifts(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (missed_shifts_id, users_id)
);
comment on table app.missed_shifts_carers is 'Bubble list field shifts_missed.carers_list_user (carers)';
create table app.threads_members (
  threads_id uuid not null references app.threads(id) on delete cascade,
  users_id uuid not null references app.users(id) on delete cascade,
  primary key (threads_id, users_id)
);
comment on table app.threads_members is 'Bubble list field thread.members_list_user (members)';

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
create index on app.shift_calls (thread);
create index on app.care_culture_checklists (carer);
create index on app.billing_clients (billing);
create index on app.billing_clients (client);
create index on app.group_chats (participant);
create index on app.consents (participant);
create index on app.cpr_certificates (carer);
create index on app.daily_living (participant);
create index on app.participant_documents (participant);
create index on app.emergency_plans (participant);
create index on app.esw_logs (resident);
create index on app.events (carer);
create index on app.events (coordinator);
create index on app.events (participant);
create index on app.events (shift);
create index on app.feedback (participant);
create index on app.first_aid_certificates (carer);
create index on app.handbook_acknowledgements (carer);
create index on app.health_profiles (participant);
create index on app.home_safety (participant);
create index on app.identity_documents (carer);
create index on app.incidents (carer);
create index on app.incidents (participant);
create index on app.info_book_signoffs (participant);
create index on app.intakes (participant);
create index on app.intakes (plan_manager);
create index on app.carer_interests (carer);
create index on app.invoices (invoice_name);
create index on app.invoices (location);
create index on app.invoices (participant);
create index on app.location_logins (location);
create index on app.medication_charts (participant);
create index on app.messages (comms_book);
create index on app.messages (thread);
create index on app.marketing_metrics (user_value);
create index on app.ndis_screening_checks (carer);
create index on app.ndis_quarters (participant);
create index on app.payslips (carer);
create index on app.police_checks (carer);
create index on app.progress_notes (carer);
create index on app.progress_notes (coordinator);
create index on app.progress_notes (participant);
create index on app.progress_notes (shift);
create index on app.qualifications (carer);
create index on app.questionnaire_sessions (carer);
create index on app.questionnaire_sessions (participant);
create index on app.questionnaire_sessions (shift);
create index on app.recurring_shifts (carer);
create index on app.recurring_shifts (coordinator);
create index on app.recurring_shifts (participant);
create index on app.recurring_shifts (shift);
create index on app.wintringham_reports (carer);
create index on app.wintringham_reports (shift);
create index on app.reviews (carer);
create index on app.reviews (client);
create index on app.reviews (location);
create index on app.reviews (shift);
create index on app.risk_assessments (intake);
create index on app.risk_assessments (participant);
create index on app.risk_management_plans (participant);
create index on app.service_agreements (participant);
create index on app.service_agreements (support_1);
create index on app.service_agreements (support_2);
create index on app.service_agreements (support_3);
create index on app.service_agreements (support_4);
create index on app.service_agreements (support_5);
create index on app.shifts (carer);
create index on app.shifts (coordinator);
create index on app.shifts (duties);
create index on app.shifts (incident);
create index on app.shifts (invoice);
create index on app.shifts (location);
create index on app.shifts (ndis_pricing);
create index on app.shifts (participant);
create index on app.shifts (progress_note);
create index on app.shifts (reporting);
create index on app.shifts (res_pricing);
create index on app.shift_duties (participant);
create index on app.shift_logs (carer);
create index on app.shift_logs (participant);
create index on app.shift_logs (shift);
create index on app.missed_shifts (location);
create index on app.missed_shifts (rate);
create index on app.superannuation (carer);
create index on app.superannuation (tfn);
create index on app.support_arrangements (ndis_pricing);
create index on app.support_arrangements (participant);
create index on app.support_arrangements (service_agreement);
create index on app.support_plans (participant);
create index on app.participant_surveys (participant);
create index on app.tfn_declarations (carer);
create index on app.unanswered_questions (questioner);
create index on app.vaccinations (carer);
create index on app.wwcc_checks (carer);

-- Lock everything down; access policies come in a later migration.
do $$ declare r record; begin
  for r in select tablename from pg_tables where schemaname = 'app' loop
    execute format('alter table app.%I enable row level security', r.tablename);
  end loop;
end $$;

