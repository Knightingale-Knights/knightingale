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

comment on column app.users.account_status is 'Bubble user.account_status_boolean';
comment on column app.users.active is 'Bubble user.active_boolean';
comment on column app.users.address is 'Bubble user.address_geographic_address';
comment on column app.users.audit is 'Bubble user.audit_boolean';
comment on column app.users.bank_details is 'Bubble user.bank_details_custom_bank_details (-> bank_details)';
comment on column app.users.bday_text is 'Bubble user.bday_text_text';
comment on column app.users.bsp is 'Bubble user.bsp_user (-> users)';
comment on column app.users.can_drive is 'Bubble user.can_drive_boolean';
comment on column app.users.care_culture is 'Bubble user.care_culture_custom_care_culture (-> care_culture_checklists)';
comment on column app.users.client_care_date is 'Bubble user.client_care_date_date';
comment on column app.users.group_chat is 'Bubble user.comms_book_custom_comms_book (-> group_chats)';
comment on column app.users.consent is 'Bubble user.consent_custom_consent (-> consents)';
comment on column app.users.contract_date is 'Bubble user.contract_date_date';
comment on column app.users.contract_signature is 'Bubble user.contract_signature_image';
comment on column app.users.coordinator is 'Bubble user.coordinator__user (-> users)';
comment on column app.users.coordinator_2 is 'Bubble user.coordinator_user (-> users)';
comment on column app.users.cpr is 'Bubble user.cpr_custom_cpr1 (-> cpr_certificates)';
comment on column app.users.current_location is 'Bubble user.current_location_geographic_address';
comment on column app.users.daily_living is 'Bubble user.daily_living_custom_daily_living (-> daily_living)';
comment on column app.users.date_of_birth is 'Bubble user.date_of_birth_date';
comment on column app.users.description is 'Bubble user.description_text';
comment on column app.users.gross_pay is 'Bubble user.earnings_number';
comment on column app.users.emergency_plan is 'Bubble user.emergency_plan_custom_emergency_plan (-> emergency_plans)';
comment on column app.users.first_aid is 'Bubble user.first_aid_custom_first_aid (-> first_aid_certificates)';
comment on column app.users.first_name is 'Bubble user.first_name_text';
comment on column app.users.gps_latitude is 'Bubble user.gps_latitude_number';
comment on column app.users.gps_longtitude is 'Bubble user.gps_longtitude_number';
comment on column app.users.handbook is 'Bubble user.handbook_custom_handbook (-> handbook_acknowledgements)';
comment on column app.users.health_profile is 'Bubble user.health_profile_custom_health_profile (-> health_profiles)';
comment on column app.users.home_safety is 'Bubble user.home_safety_custom_home_safety (-> home_safety)';
comment on column app.users.hours is 'Bubble user.hours_number';
comment on column app.users.id_document is 'Bubble user.id_custom_id1 (-> identity_documents)';
comment on column app.users.info_book is 'Bubble user.info_book_custom_info_book (-> info_book_signoffs)';
comment on column app.users.intake_form is 'Bubble user.intake_form_custom_intake_form (-> intakes)';
comment on column app.users.interests is 'Bubble user.interests_custom_interests (-> carer_interests)';
comment on column app.users.knowledge_base is 'Bubble user.knowledge_base_custom_thread (-> threads)';
comment on column app.users.last_name is 'Bubble user.last_name_text';
comment on column app.users.medication_chart is 'Bubble user.medication_chart_custom_medication_chart (-> medication_charts)';
comment on column app.users.middle_name is 'Bubble user.middle_name_text';
comment on column app.users.ndis is 'Bubble user.ndis_custom_ndis (-> ndis_screening_checks)';
comment on column app.users.ndis_induction is 'Bubble user.ndis_induction_file';
comment on column app.users.ndis_number is 'Bubble user.ndis_number_text';
comment on column app.users.net_pay is 'Bubble user.net_earnings_number';
comment on column app.users.notification is 'Bubble user.notification_boolean';
comment on column app.users.phone_number is 'Bubble user.phone_number_text';
comment on column app.users.profile_photo is 'Bubble user.photo_image';
comment on column app.users.plan_end is 'Bubble user.plan_end_date';
comment on column app.users.plan_manager is 'Bubble user.plan_manager_custom_plan_manager (-> plan_managers)';
comment on column app.users.plan_start is 'Bubble user.plan_start_date';
comment on column app.users.police_check is 'Bubble user.police_check_custom_police_check (-> police_checks)';
comment on column app.users.priority is 'Bubble user.priority_number';
comment on column app.users.account_type is 'Bubble user.profile_option_profile (option set: profile)';
comment on column app.users.progress_note is 'Bubble user.progress_note1_boolean';
comment on column app.users.rating is 'Bubble user.rating_number';
comment on column app.users.resume is 'Bubble user.resume_file';
comment on column app.users.risk_assessment is 'Bubble user.risk_assessment_custom_risk_assessment (-> risk_assessments)';
comment on column app.users.roles is 'Bubble user.roles_list_option_roles (option set: roles)';
comment on column app.users.room_no is 'Bubble user.room_no___text';
comment on column app.users.service_agreement is 'Bubble user.service_agreement_custom_service_agreement (-> service_agreements)';
comment on column app.users.sex is 'Bubble user.sex_option_sex (option set: sex)';
comment on column app.users.shift_time is 'Bubble user.shift_time_list_option_shift_time (option set: shift_time)';
comment on column app.users.super is 'Bubble user.super_number';
comment on column app.users.superannuation is 'Bubble user.superannuation_custom_superannuation (-> superannuation)';
comment on column app.users.support_plan is 'Bubble user.support_plan_custom_support_plan (-> support_plans)';
comment on column app.users.survey is 'Bubble user.survey_boolean';
comment on column app.users.tax_file_number is 'Bubble user.tax_file_number_custom_tax_file_number_declaration (-> tfn_declarations)';
comment on column app.users.tax is 'Bubble user.tax_number';
comment on column app.users.thread is 'Bubble user.thread_custom_thread (-> threads)';
comment on column app.users.vaccinations is 'Bubble user.vaccinations_custom_vaccinations (-> vaccinations)';
comment on column app.users.website is 'Bubble user.website_text';
comment on column app.users.work_locations is 'Bubble user.work_locations_list_text';
comment on column app.users.wwcc is 'Bubble user.wwcc_custom_working_with_children_check (-> wwcc_checks)';
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
comment on column app.shift_calls.date is 'Bubble calls.date_text';
comment on column app.shift_calls.location is 'Bubble calls.location_text';
comment on column app.shift_calls.nurses is 'Bubble calls.nurses_list_text';
comment on column app.shift_calls.shift is 'Bubble calls.shift_text';
comment on column app.shift_calls.status is 'Bubble calls.status_text';
comment on column app.shift_calls.thread is 'Bubble calls.thread_custom_thread (-> threads)';
comment on column app.care_culture_checklists.carer is 'Bubble care_culture.carer_user (-> users)';
comment on column app.care_culture_checklists.compassion is 'Bubble care_culture.compassion_boolean';
comment on column app.care_culture_checklists.future is 'Bubble care_culture.future_boolean';
comment on column app.care_culture_checklists.hospitality is 'Bubble care_culture.hospitality_boolean';
comment on column app.care_culture_checklists.intro is 'Bubble care_culture.intro_boolean';
comment on column app.care_culture_checklists.lifer is 'Bubble care_culture.lifer_boolean';
comment on column app.care_culture_checklists.listen is 'Bubble care_culture.listen_boolean';
comment on column app.care_culture_checklists.one is 'Bubble care_culture.number_one_boolean';
comment on column app.care_culture_checklists.paid is 'Bubble care_culture.paid_boolean';
comment on column app.care_culture_checklists.philosophy is 'Bubble care_culture.philosophy_boolean';
comment on column app.care_culture_checklists.proactive is 'Bubble care_culture.proactive_boolean';
comment on column app.care_culture_checklists.refusals is 'Bubble care_culture.refusals_boolean';
comment on column app.care_culture_checklists.to_do_list is 'Bubble care_culture.to_do_list_boolean';
comment on column app.care_culture_checklists.trust is 'Bubble care_culture.trust_boolean';
comment on column app.care_culture_checklists.trust_video is 'Bubble care_culture.trust_video_text_text';
comment on column app.care_culture_checklists.vision is 'Bubble care_culture.vision_boolean';
comment on column app.billing_clients.billing_email is 'Bubble client.billing_email_text';
comment on column app.billing_clients.billing is 'Bubble client.billing_user (-> users)';
comment on column app.billing_clients.client is 'Bubble client.client_user (-> users)';
comment on column app.group_chats.participant is 'Bubble comms_book.participant_user (-> users)';
comment on column app.consents.f_10_sharing is 'Bubble consent.10_sharing_boolean';
comment on column app.consents.f_11_allied is 'Bubble consent.11_allied_boolean';
comment on column app.consents.f_1_audits is 'Bubble consent.1_audits_boolean';
comment on column app.consents.f_2_surveys is 'Bubble consent.2_surveys_boolean';
comment on column app.consents.f_3_ads is 'Bubble consent.3__ads_boolean';
comment on column app.consents.f_4_recruitment is 'Bubble consent.4_recruitment_boolean';
comment on column app.consents.f_5_reporting is 'Bubble consent.5_reporting_boolean';
comment on column app.consents.f_6_training is 'Bubble consent.6_training_boolean';
comment on column app.consents.f_7_marketing is 'Bubble consent.7_marketing_boolean';
comment on column app.consents.f_8_audiovisual is 'Bubble consent.8_audiovisual_boolean';
comment on column app.consents.f_9_photos is 'Bubble consent.9_photos_boolean';
comment on column app.consents.consent_no is 'Bubble consent.consent_no_text';
comment on column app.consents.consent_yes is 'Bubble consent.consent_yes_text';
comment on column app.consents.participant_signature is 'Bubble consent.participant_signature_image';
comment on column app.consents.participant is 'Bubble consent.participant_user (-> users)';
comment on column app.consents.signed_date is 'Bubble consent.signed_date_date';
comment on column app.cpr_certificates.carer is 'Bubble cpr1.carer_user (-> users)';
comment on column app.cpr_certificates.cpr_certificate is 'Bubble cpr1.cpr_certificate_file';
comment on column app.cpr_certificates.expiry is 'Bubble cpr1.expiry_date';
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
comment on column app.participant_documents.audit is 'Bubble document.audit_boolean';
comment on column app.participant_documents.doc is 'Bubble document.doc_file';
comment on column app.participant_documents.name is 'Bubble document.name_text';
comment on column app.participant_documents.participant is 'Bubble document.participant_user (-> users)';
comment on column app.emergency_plans.backup_power is 'Bubble emergency_plan.backup_power_text';
comment on column app.emergency_plans.fire_evacuation is 'Bubble emergency_plan.fire_evacuation_text';
comment on column app.emergency_plans.fire_steps is 'Bubble emergency_plan.fire_steps_text';
comment on column app.emergency_plans.hospital_steps is 'Bubble emergency_plan.hospital_steps_text';
comment on column app.emergency_plans.hospital is 'Bubble emergency_plan.hospital_text';
comment on column app.emergency_plans.infectious_steps is 'Bubble emergency_plan.infectious_steps_text';
comment on column app.emergency_plans.infectious is 'Bubble emergency_plan.infectious_text';
comment on column app.emergency_plans.natural_disaster_steps is 'Bubble emergency_plan.natural_disaster_steps_text';
comment on column app.emergency_plans.natural_disaster is 'Bubble emergency_plan.natural_disaster_text';
comment on column app.emergency_plans.participant_signature is 'Bubble emergency_plan.participant_signature_image';
comment on column app.emergency_plans.participant is 'Bubble emergency_plan.participant_user (-> users)';
comment on column app.emergency_plans.power_outage is 'Bubble emergency_plan.power_outage_text';
comment on column app.emergency_plans.signed_date is 'Bubble emergency_plan.signed_date_date';
comment on column app.emergency_plans.supplies is 'Bubble emergency_plan.supplies_text';
comment on column app.esw_logs.activity_code is 'Bubble esw.activity_code_option_activity (option set: activity)';
comment on column app.esw_logs.date is 'Bubble esw.date_date';
comment on column app.esw_logs.duration is 'Bubble esw.duration_number';
comment on column app.esw_logs.feedback is 'Bubble esw.feedback_text';
comment on column app.esw_logs.offsite is 'Bubble esw.offsite_boolean';
comment on column app.esw_logs.onsite is 'Bubble esw.onsite_boolean';
comment on column app.esw_logs.refusal is 'Bubble esw.refusal_boolean';
comment on column app.esw_logs.resident is 'Bubble esw.resident_user (-> users)';
comment on column app.esw_logs.support_level is 'Bubble esw.support_level_number';
comment on column app.events.address is 'Bubble event.address_geographic_address';
comment on column app.events.carer is 'Bubble event.carer_user (-> users)';
comment on column app.events.coordinator is 'Bubble event.coordinator_user (-> users)';
comment on column app.events.date is 'Bubble event.date_date';
comment on column app.events.details is 'Bubble event.details_text';
comment on column app.events.done is 'Bubble event.done_boolean';
comment on column app.events.notes is 'Bubble event.notes_text';
comment on column app.events.refused is 'Bubble event.refused_boolean';
comment on column app.events.participant is 'Bubble event.resident_user (-> users)';
comment on column app.events.shift is 'Bubble event.shift_custom_shift (-> shifts)';
comment on column app.events.time is 'Bubble event.time_text';
comment on column app.events.to_do is 'Bubble event.to_do_boolean';
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
comment on column app.first_aid_certificates.carer is 'Bubble first_aid.carer_user (-> users)';
comment on column app.first_aid_certificates.expiry is 'Bubble first_aid.expiry_date';
comment on column app.first_aid_certificates.first_aid_certificate is 'Bubble first_aid.first_aid_certificate_file';
comment on column app.food_fluid_logs.comment is 'Bubble food_fluid.comment_text';
comment on column app.food_fluid_logs.food_fluid is 'Bubble food_fluid.food_fluid_option_food_fluid (option set: food_fluid)';
comment on column app.food_fluid_logs.meal is 'Bubble food_fluid.meal_option_meal (option set: meal)';
comment on column app.food_fluid_logs.name is 'Bubble food_fluid.name_text';
comment on column app.food_fluid_logs.quantity is 'Bubble food_fluid.quantity_option_quantity (option set: quantity)';
comment on column app.handbook_acknowledgements.carer is 'Bubble handbook.carer_user (-> users)';
comment on column app.handbook_acknowledgements.hg10 is 'Bubble handbook.hg10_boolean';
comment on column app.handbook_acknowledgements.hg11 is 'Bubble handbook.hg11_boolean';
comment on column app.handbook_acknowledgements.hg12 is 'Bubble handbook.hg12_boolean';
comment on column app.handbook_acknowledgements.hg13 is 'Bubble handbook.hg13_boolean';
comment on column app.handbook_acknowledgements.hg14 is 'Bubble handbook.hg14_boolean';
comment on column app.handbook_acknowledgements.hg15 is 'Bubble handbook.hg15_boolean';
comment on column app.handbook_acknowledgements.hg1 is 'Bubble handbook.hg1_boolean';
comment on column app.handbook_acknowledgements.hg2 is 'Bubble handbook.hg2_boolean';
comment on column app.handbook_acknowledgements.hg3 is 'Bubble handbook.hg3_boolean';
comment on column app.handbook_acknowledgements.hg4 is 'Bubble handbook.hg4_boolean';
comment on column app.handbook_acknowledgements.hg5 is 'Bubble handbook.hg5_boolean';
comment on column app.handbook_acknowledgements.hg6 is 'Bubble handbook.hg6_boolean';
comment on column app.handbook_acknowledgements.hg7 is 'Bubble handbook.hg7_boolean';
comment on column app.handbook_acknowledgements.hg8 is 'Bubble handbook.hg8_boolean';
comment on column app.handbook_acknowledgements.hg9 is 'Bubble handbook.hg9_boolean';
comment on column app.health_profiles.allergies is 'Bubble health_profile.allergies_text';
comment on column app.health_profiles.behaviour_support_plan is 'Bubble health_profile.behaviour_support_plan_option_answer (option set: answer)';
comment on column app.health_profiles.doctor_address is 'Bubble health_profile.doctor_address_geographic_address';
comment on column app.health_profiles.doctor_clinic is 'Bubble health_profile.doctor_clinic_text';
comment on column app.health_profiles.doctor_name is 'Bubble health_profile.doctor_name_text';
comment on column app.health_profiles.doctor_phone is 'Bubble health_profile.doctor_phone_text';
comment on column app.health_profiles.emergency_contact_name_one is 'Bubble health_profile.emergency_contact_name_one_text';
comment on column app.health_profiles.emergency_contact_name_two is 'Bubble health_profile.emergency_contact_name_two_text';
comment on column app.health_profiles.emergency_contact_phone_one is 'Bubble health_profile.emergency_contact_phone_one_text';
comment on column app.health_profiles.emergency_contact_phone_two is 'Bubble health_profile.emergency_contact_phone_two_text';
comment on column app.health_profiles.emergency_contact_relationship_one is 'Bubble health_profile.emergency_contact_relationship_one_text';
comment on column app.health_profiles.emergency_contact_relationship_two is 'Bubble health_profile.emergency_contact_relationship_two_text';
comment on column app.health_profiles.hospital_admissions is 'Bubble health_profile.hospital_admissions_text';
comment on column app.health_profiles.last_hospital_stay_length is 'Bubble health_profile.last_hospital_stay_length_text';
comment on column app.health_profiles.medications is 'Bubble health_profile.medications_text';
comment on column app.health_profiles.mental_health is 'Bubble health_profile.mental_health_list_option_mental_health (option set: mental_health)';
comment on column app.health_profiles.mental_health_other is 'Bubble health_profile.mental_health_other_text';
comment on column app.health_profiles.ndis_primary_diagnosis is 'Bubble health_profile.ndis_primary_diagnosis_text';
comment on column app.health_profiles.ndis_secondary_diagnosis is 'Bubble health_profile.ndis_secondary_diagnosis_text';
comment on column app.health_profiles.participant is 'Bubble health_profile.participant_user (-> users)';
comment on column app.health_profiles.pharmacist_name is 'Bubble health_profile.pharmacist_name_text';
comment on column app.health_profiles.pharmacist_phone is 'Bubble health_profile.pharmacist_phone_text';
comment on column app.health_profiles.pharmacy_address is 'Bubble health_profile.pharmacy_address_geographic_address';
comment on column app.health_profiles.physical_health is 'Bubble health_profile.physical_health_list_option_physical_health (option set: physical_health)';
comment on column app.health_profiles.physical_health_other is 'Bubble health_profile.physical_health_other_text';
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
comment on column app.identity_documents.carer is 'Bubble id1.carer_user (-> users)';
comment on column app.identity_documents.citizenship is 'Bubble id1.citizenship_file';
comment on column app.identity_documents.insurance is 'Bubble id1.insurance_file';
comment on column app.identity_documents.license is 'Bubble id1.license_file';
comment on column app.identity_documents.passport is 'Bubble id1.passport_file';
comment on column app.incidents.agencies_reported is 'Bubble incident.agencies_reported_text';
comment on column app.incidents.carer is 'Bubble incident.carer_user (-> users)';
comment on column app.incidents.future_prevention is 'Bubble incident.future_prevention_text';
comment on column app.incidents.incident_date is 'Bubble incident.incident_date_date';
comment on column app.incidents.incident_description is 'Bubble incident.incident_description_text';
comment on column app.incidents.incident_harm is 'Bubble incident.incident_harm_text';
comment on column app.incidents.incident_location is 'Bubble incident.incident_location_text';
comment on column app.incidents.incident_management is 'Bubble incident.incident_management_text';
comment on column app.incidents.incident_resolution is 'Bubble incident.incident_resolution_text';
comment on column app.incidents.incident_type is 'Bubble incident.incident_type_text';
comment on column app.incidents.injury_location is 'Bubble incident.injury_location_text';
comment on column app.incidents.injury_nature is 'Bubble incident.injury_nature_text';
comment on column app.incidents.investigation_outcome is 'Bubble incident.investigation_outcome_text';
comment on column app.incidents.ndis_reported_date is 'Bubble incident.ndis_reported_date_date';
comment on column app.incidents.ndis_reported is 'Bubble incident.ndis_reported_text';
comment on column app.incidents.not_ndis is 'Bubble incident.not_ndis_text';
comment on column app.incidents.participant_feedback is 'Bubble incident.participant_feedback_text';
comment on column app.incidents.participant is 'Bubble incident.participant_user (-> users)';
comment on column app.incidents.preventable_incident is 'Bubble incident.preventable_incident_text';
comment on column app.incidents.reportable_type is 'Bubble incident.reportable__type__text';
comment on column app.incidents.reportable_yes_no is 'Bubble incident.reportable__yes_no__text';
comment on column app.incidents.safety_actions is 'Bubble incident.safety_actions1_text';
comment on column app.incidents.team_informed is 'Bubble incident.team_informed1_text';
comment on column app.incidents.team_informed_date is 'Bubble incident.team_informed_date_date';
comment on column app.incidents.witnesses is 'Bubble incident.witnesses_text';
comment on column app.info_book_signoffs.participant_signature is 'Bubble info_book.participant_signature_image';
comment on column app.info_book_signoffs.participant is 'Bubble info_book.participant_user (-> users)';
comment on column app.info_book_signoffs.representative_signature is 'Bubble info_book.representative_signature_image';
comment on column app.info_book_signoffs.representative is 'Bubble info_book.representative_text';
comment on column app.info_book_signoffs.signed_date is 'Bubble info_book.signed_date_date';
comment on column app.intakes.aboriginal is 'Bubble intake_form.aboriginal_text';
comment on column app.intakes.allergies is 'Bubble intake_form.allergies_text';
comment on column app.intakes.assist_by is 'Bubble intake_form.assist_by_text';
comment on column app.intakes.bsp is 'Bubble intake_form.bsp_text';
comment on column app.intakes.carer_language is 'Bubble intake_form.carer_language_text';
comment on column app.intakes.carer_personality is 'Bubble intake_form.carer_personality_text';
comment on column app.intakes.carer_skills is 'Bubble intake_form.carer_skills_text';
comment on column app.intakes.carer_training is 'Bubble intake_form.carer_training_text';
comment on column app.intakes.communication_type is 'Bubble intake_form.communication_type_option_communication_type (option set: communication_type)';
comment on column app.intakes.consent is 'Bubble intake_form.consent_list_option_participation_consent (option set: participation_consent)';
comment on column app.intakes.contact1address is 'Bubble intake_form.contact1address_geographic_address';
comment on column app.intakes.contact1advocacyform is 'Bubble intake_form.contact1advocacyform_text';
comment on column app.intakes.contact1email is 'Bubble intake_form.contact1email_text';
comment on column app.intakes.contact1phone is 'Bubble intake_form.contact1phone_text';
comment on column app.intakes.contact1relation is 'Bubble intake_form.contact1relation_text';
comment on column app.intakes.contact2address is 'Bubble intake_form.contact2address_geographic_address';
comment on column app.intakes.contact2advocacyform is 'Bubble intake_form.contact2advocacyform_text';
comment on column app.intakes.contact2email is 'Bubble intake_form.contact2email_text';
comment on column app.intakes.contact2phone is 'Bubble intake_form.contact2phone_text';
comment on column app.intakes.contact2relation is 'Bubble intake_form.contact2relation_text';
comment on column app.intakes.contact1name is 'Bubble intake_form.contact_one_1_text';
comment on column app.intakes.contact1 is 'Bubble intake_form.contact_one_option_contact (option set: contact)';
comment on column app.intakes.contact2name is 'Bubble intake_form.contact_two_2_text';
comment on column app.intakes.contact2 is 'Bubble intake_form.contact_two_option_contact (option set: contact)';
comment on column app.intakes.cultural_values is 'Bubble intake_form.cultural_values_text';
comment on column app.intakes.carer_culture is 'Bubble intake_form.culture_text';
comment on column app.intakes.dairy is 'Bubble intake_form.dairy_text';
comment on column app.intakes.diagnosis is 'Bubble intake_form.diagnosis_text';
comment on column app.intakes.diet_requirements is 'Bubble intake_form.diet_requirements_text';
comment on column app.intakes.dont_eat is 'Bubble intake_form.dont_eat_text';
comment on column app.intakes.favourite_food is 'Bubble intake_form.favourite_food_text';
comment on column app.intakes.gender is 'Bubble intake_form.gender_text';
comment on column app.intakes.gluten is 'Bubble intake_form.gluten_text';
comment on column app.intakes.goals is 'Bubble intake_form.goals_text';
comment on column app.intakes.hobbies is 'Bubble intake_form.hobbies_text';
comment on column app.intakes.hospital_admission_assistance is 'Bubble intake_form.hospital_admission_assistance_text';
comment on column app.intakes.hospital_admission_history is 'Bubble intake_form.hospital_admission_history_text';
comment on column app.intakes.interpreter is 'Bubble intake_form.interpreter_text';
comment on column app.intakes.knightingale_signature is 'Bubble intake_form.knightingale_signature_image';
comment on column app.intakes.language is 'Bubble intake_form.language_text';
comment on column app.intakes.legal_issues is 'Bubble intake_form.legal_issues_text';
comment on column app.intakes.living_situation is 'Bubble intake_form.living_situation_option_living_situation (option set: living_situation)';
comment on column app.intakes.manual_handling is 'Bubble intake_form.manual_handling_list_option_manual_handling (option set: manual_handling)';
comment on column app.intakes.medication_assistance is 'Bubble intake_form.medication_assistance_text';
comment on column app.intakes.medications is 'Bubble intake_form.medications_text';
comment on column app.intakes.mental_health is 'Bubble intake_form.mental_health_list_option_mental_health (option set: mental_health)';
comment on column app.intakes.mental_medications is 'Bubble intake_form.mental_medications_text';
comment on column app.intakes.mobility is 'Bubble intake_form.mobility_list_option_mobility (option set: mobility)';
comment on column app.intakes.ndis_funding is 'Bubble intake_form.ndis_funding_option_ndis_funding (option set: ndis_funding)';
comment on column app.intakes.other_info is 'Bubble intake_form.other_info_text';
comment on column app.intakes.outcomes is 'Bubble intake_form.outcomes_text';
comment on column app.intakes.participant_signature is 'Bubble intake_form.participant_signature_image';
comment on column app.intakes.participant is 'Bubble intake_form.participant_user (-> users)';
comment on column app.intakes.personal_care is 'Bubble intake_form.personal_care_list_option_personal_care (option set: personal_care)';
comment on column app.intakes.physical_health is 'Bubble intake_form.physical_health_list_option_physical_health (option set: physical_health)';
comment on column app.intakes.physical_medications is 'Bubble intake_form.physical_medications_text';
comment on column app.intakes.plan_manager is 'Bubble intake_form.plan_manager_custom_plan_manager (-> plan_managers)';
comment on column app.intakes.communication_method is 'Bubble intake_form.preferred_communication_option_communication_method (option set: communication_method)';
comment on column app.intakes.primary_diagnosis is 'Bubble intake_form.primary_diagnosis_text';
comment on column app.intakes.religion is 'Bubble intake_form.religion_text';
comment on column app.intakes.representative_signature is 'Bubble intake_form.representative_signature_image';
comment on column app.intakes.secondary_diagnosis is 'Bubble intake_form.secondary_diagnosis_text';
comment on column app.intakes.services is 'Bubble intake_form.services_list_option_service_required (option set: service_required)';
comment on column app.intakes.signature_date is 'Bubble intake_form.signature_date_date';
comment on column app.intakes.carer_age is 'Bubble intake_form.staff_age_text';
comment on column app.intakes.carer_gender is 'Bubble intake_form.staff_gender_option_sex (option set: sex)';
comment on column app.intakes.support_needs is 'Bubble intake_form.support_needs_text';
comment on column app.intakes.twelve_month_goals is 'Bubble intake_form.twelve_month_goals_text';
comment on column app.intakes.unique_you is 'Bubble intake_form.unique_you_text';
comment on column app.intakes.vegan is 'Bubble intake_form.vegan_text';
comment on column app.intakes.vegetarian is 'Bubble intake_form.vegetarian_text';
comment on column app.carer_interests.animal is 'Bubble interests.animal_text';
comment on column app.carer_interests.carer is 'Bubble interests.carer_user (-> users)';
comment on column app.carer_interests.education is 'Bubble interests.education_text';
comment on column app.carer_interests.fav_foods is 'Bubble interests.fav_foods_text';
comment on column app.carer_interests.film is 'Bubble interests.film_text';
comment on column app.carer_interests.hobbies is 'Bubble interests.hobbies_text';
comment on column app.carer_interests.music is 'Bubble interests.music_text';
comment on column app.carer_interests.musical_genre is 'Bubble interests.musical_genre_text';
comment on column app.carer_interests.past_story is 'Bubble interests.past_story_text';
comment on column app.carer_interests.pets is 'Bubble interests.pets_text';
comment on column app.carer_interests.skills is 'Bubble interests.skills_text';
comment on column app.carer_interests.sport is 'Bubble interests.sport_text';
comment on column app.carer_interests.team is 'Bubble interests.team_text';
comment on column app.carer_interests.tv_film is 'Bubble interests.tv_film_text';
comment on column app.carer_interests.why_care is 'Bubble interests.why_care_text';
comment on column app.invoices.amount is 'Bubble invoice.amount_number';
comment on column app.invoices.period_ending is 'Bubble invoice.date_date';
comment on column app.invoices.invoice_file is 'Bubble invoice.invoice_file_file';
comment on column app.invoices.invoice_image is 'Bubble invoice.invoice_image_file';
comment on column app.invoices.invoice_name is 'Bubble invoice.invoice_name_user (-> users)';
comment on column app.invoices.invoice_number is 'Bubble invoice.invoice_number_text';
comment on column app.invoices.location is 'Bubble invoice.location_custom_location1 (-> locations)';
comment on column app.invoices.participant is 'Bubble invoice.participant_user (-> users)';
comment on column app.invoices.status is 'Bubble invoice.status_boolean';
comment on column app.locations.address is 'Bubble location1.address_geographic_address';
comment on column app.locations.details is 'Bubble location1.details_text';
comment on column app.locations.email is 'Bubble location1.email_text';
comment on column app.locations.handbook is 'Bubble location1.handbook_file';
comment on column app.locations.invoiced_through_date is 'Bubble location1.invoiced_through_date_date';
comment on column app.locations.location is 'Bubble location1.location_option_location0 (option set: location0)';
comment on column app.locations.name is 'Bubble location1.name_text';
comment on column app.locations.ndis is 'Bubble location1.ndis__text';
comment on column app.locations.beds is 'Bubble location1.no_of_residents_number';
comment on column app.location_logins.location is 'Bubble login.location_custom_location1 (-> locations)';
comment on column app.location_logins.password is 'Bubble login.password_text';
comment on column app.location_logins.username is 'Bubble login.username_text';
comment on column app.medication_charts.date is 'Bubble medication_chart.date_list_date';
comment on column app.medication_charts.meds is 'Bubble medication_chart.meds_text';
comment on column app.medication_charts.participant is 'Bubble medication_chart.participant_user (-> users)';
comment on column app.messages.attachment is 'Bubble message.attachment_file';
comment on column app.messages.comms_book is 'Bubble message.comms_book_custom_comms_book (-> group_chats)';
comment on column app.messages.content is 'Bubble message.content_text';
comment on column app.messages.knowledge_base is 'Bubble message.knowledge_base_boolean';
comment on column app.messages.sender is 'Bubble message.sender_text';
comment on column app.messages.thread is 'Bubble message.thread_custom_thread (-> threads)';
comment on column app.marketing_metrics.acu_join_bottom is 'Bubble metrics.acu_join_bottom_number';
comment on column app.marketing_metrics.acu_join_top is 'Bubble metrics.acu_join_top_number';
comment on column app.marketing_metrics.acu_landings is 'Bubble metrics.acu_landings_number';
comment on column app.marketing_metrics.acu_sign_up is 'Bubble metrics.acu_sign_up_number';
comment on column app.marketing_metrics.graduate_join_bottom is 'Bubble metrics.graduate_join_bottom_number';
comment on column app.marketing_metrics.graduate_join_top is 'Bubble metrics.graduate_join_top_number';
comment on column app.marketing_metrics.graduate_landings is 'Bubble metrics.graduate_landings_number';
comment on column app.marketing_metrics.graduate_sign_up is 'Bubble metrics.graduate_sign_up_text';
comment on column app.marketing_metrics.join_bottom is 'Bubble metrics.join_bottom_number';
comment on column app.marketing_metrics.join_top is 'Bubble metrics.join_number';
comment on column app.marketing_metrics.landings is 'Bubble metrics.landings_number';
comment on column app.marketing_metrics.sign_up is 'Bubble metrics.sign_up_number';
comment on column app.marketing_metrics.user_value is 'Bubble metrics.user_user (-> users)';
comment on column app.ndis_screening_checks.carer is 'Bubble ndis.carer_user (-> users)';
comment on column app.ndis_screening_checks.expiry_date is 'Bubble ndis.expiry_date_date';
comment on column app.ndis_screening_checks.id_number is 'Bubble ndis.id_number_text';
comment on column app.ndis_price_items.carer_pay_name is 'Bubble ndis_pricing.carer_pay_name_text';
comment on column app.ndis_price_items.carer_pay is 'Bubble ndis_pricing.carer_pay_number';
comment on column app.ndis_price_items.hourly_revenue is 'Bubble ndis_pricing.hourly_revenue_number';
comment on column app.ndis_price_items.item_name is 'Bubble ndis_pricing.item_name_text';
comment on column app.ndis_price_items.item_no is 'Bubble ndis_pricing.item_no_text';
comment on column app.ndis_price_items.item_price is 'Bubble ndis_pricing.item_price_number';
comment on column app.ndis_quarters.amount is 'Bubble ndis_quarter.amount_number';
comment on column app.ndis_quarters.remaining_days is 'Bubble ndis_quarter.days_remaining_number';
comment on column app.ndis_quarters.days_to_quarter_end is 'Bubble ndis_quarter.days_to_quarter_end_number';
comment on column app.ndis_quarters.end_value is 'Bubble ndis_quarter.end_date';
comment on column app.ndis_quarters.end_days is 'Bubble ndis_quarter.end_days_number';
comment on column app.ndis_quarters.hours_per_week is 'Bubble ndis_quarter.hours_per_shift_number';
comment on column app.ndis_quarters.participant is 'Bubble ndis_quarter.participant_user (-> users)';
comment on column app.ndis_quarters.quarter_days is 'Bubble ndis_quarter.quarter_days_number';
comment on column app.ndis_quarters.quarter is 'Bubble ndis_quarter.quarter_number';
comment on column app.ndis_quarters.rate is 'Bubble ndis_quarter.rate_number';
comment on column app.ndis_quarters.remaining_budget is 'Bubble ndis_quarter.remaining_number';
comment on column app.ndis_quarters.spent is 'Bubble ndis_quarter.spent_number';
comment on column app.ndis_quarters.start is 'Bubble ndis_quarter.start_date';
comment on column app.payslips.address is 'Bubble payslip.address_geographic_address';
comment on column app.payslips.gross_pay is 'Bubble payslip.amount_number';
comment on column app.payslips.carer is 'Bubble payslip.carer_user (-> users)';
comment on column app.payslips.hours_worked is 'Bubble payslip.hours_worked_number';
comment on column app.payslips.net_pay is 'Bubble payslip.net_amount_number';
comment on column app.payslips.pay_period_start is 'Bubble payslip.pat_period_start_date';
comment on column app.payslips.pay_period_ending is 'Bubble payslip.pay_period_ending_date';
comment on column app.payslips.payment_date is 'Bubble payslip.period_ending_date';
comment on column app.payslips.role is 'Bubble payslip.role_option_roles (option set: roles)';
comment on column app.payslips.super is 'Bubble payslip.super_number';
comment on column app.payslips.tax is 'Bubble payslip.tax_number';
comment on column app.payslips.travel is 'Bubble payslip.travel_number';
comment on column app.payslips.ytd_gross is 'Bubble payslip.ytd_gross_number';
comment on column app.payslips.ytd_net is 'Bubble payslip.ytd_net_number';
comment on column app.payslips.ytd_tax is 'Bubble payslip.ytd_tax_number';
comment on column app.plan_managers.address is 'Bubble plan_manager.address1_geographic_address';
comment on column app.plan_managers.email is 'Bubble plan_manager.email_text';
comment on column app.plan_managers.name is 'Bubble plan_manager.name_text';
comment on column app.plan_managers.phone is 'Bubble plan_manager.phone_text';
comment on column app.police_checks.carer is 'Bubble police_check.carer_user (-> users)';
comment on column app.police_checks.expiry_date is 'Bubble police_check.expiry_date_date';
comment on column app.police_checks.image is 'Bubble police_check.image_file';
comment on column app.police_checks.passed is 'Bubble police_check.passed_boolean';
comment on column app.police_checks.reference_number is 'Bubble police_check.reference_number_text';
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
comment on column app.progress_notes.shift is 'Bubble progress_notes.shift_custom_shift (-> shifts)';
comment on column app.progress_notes.submit is 'Bubble progress_notes.submit_boolean';
comment on column app.progress_notes.summary is 'Bubble progress_notes.summary_text';
comment on column app.qualifications.ahpra is 'Bubble qualifications.ahpra_list_file';
comment on column app.qualifications.carer is 'Bubble qualifications.carer_user (-> users)';
comment on column app.qualifications.expiry is 'Bubble qualifications.expiry_date_date';
comment on column app.qualifications.qualifications is 'Bubble qualifications.qualifications_list_option_skills (option set: skills)';
comment on column app.qualifications.registration_number is 'Bubble qualifications.registration_number_text';
comment on column app.qualifications.role is 'Bubble qualifications.role1_list_option_roles (option set: roles)';
comment on column app.qualifications.transcript is 'Bubble qualifications.transcript_list_file';
comment on column app.questionnaire_sessions.call_sid is 'Bubble questionnaire_session.call_sid_text';
comment on column app.questionnaire_sessions.carer is 'Bubble questionnaire_session.carer_user (-> users)';
comment on column app.questionnaire_sessions.completed is 'Bubble questionnaire_session.completed_date';
comment on column app.questionnaire_sessions.heads_up_sent is 'Bubble questionnaire_session.heads_up_sent_date';
comment on column app.questionnaire_sessions.participant is 'Bubble questionnaire_session.participant_user (-> users)';
comment on column app.questionnaire_sessions.scheduled_call is 'Bubble questionnaire_session.scheduled_call_date';
comment on column app.questionnaire_sessions.section is 'Bubble questionnaire_session.section_option_questionnaire_section (option set: questionnaire_section)';
comment on column app.questionnaire_sessions.shift is 'Bubble questionnaire_session.shift_custom_shift (-> shifts)';
comment on column app.questionnaire_sessions.skipped_fields is 'Bubble questionnaire_session.skipped_fields_text';
comment on column app.questionnaire_sessions.started is 'Bubble questionnaire_session.started_date';
comment on column app.questionnaire_sessions.status is 'Bubble questionnaire_session.status_option_questionnaire_status (option set: questionnaire_status)';
comment on column app.questionnaire_sessions.transcript is 'Bubble questionnaire_session.transcript_text';
comment on column app.quotes.quote is 'Bubble quote.quote_text';
comment on column app.recurring_shifts.carer is 'Bubble recurring.carer_user (-> users)';
comment on column app.recurring_shifts.coordinator is 'Bubble recurring.coordinator_user (-> users)';
comment on column app.recurring_shifts.day is 'Bubble recurring.day_text';
comment on column app.recurring_shifts.end_value is 'Bubble recurring.end_text';
comment on column app.recurring_shifts.hours is 'Bubble recurring.hours_number';
comment on column app.recurring_shifts.participant is 'Bubble recurring.participant_user (-> users)';
comment on column app.recurring_shifts.shift is 'Bubble recurring.shift_custom_shift (-> shifts)';
comment on column app.recurring_shifts.start is 'Bubble recurring.start_text';
comment on column app.wintringham_reports.carer is 'Bubble reporting.carer_user (-> users)';
comment on column app.wintringham_reports.invoice_amount is 'Bubble reporting.invoice_amount_number';
comment on column app.wintringham_reports.invoice_date is 'Bubble reporting.invoice_date_date';
comment on column app.wintringham_reports.invoice_number is 'Bubble reporting.invoice_number_text';
comment on column app.wintringham_reports.qualification is 'Bubble reporting.qualification_option_roles (option set: roles)';
comment on column app.wintringham_reports.rate_per_hour is 'Bubble reporting.rate_per_hour_number';
comment on column app.wintringham_reports.shift is 'Bubble reporting.shift_custom_shift (-> shifts)';
comment on column app.wintringham_reports.shift_date is 'Bubble reporting.shift_date_date';
comment on column app.wintringham_reports.end_time is 'Bubble reporting.shift_end_time_text';
comment on column app.wintringham_reports.shift_hours is 'Bubble reporting.shift_hours_number';
comment on column app.wintringham_reports.start_time is 'Bubble reporting.shift_start_time_text';
comment on column app.wintringham_reports.wintringham_site is 'Bubble reporting.site_text';
comment on column app.residential_prices.carer_pay is 'Bubble residential_pricings.carer_pay_number';
comment on column app.residential_prices.hourly_revenue is 'Bubble residential_pricings.hourly_revenue_number';
comment on column app.residential_prices.name is 'Bubble residential_pricings.name_text';
comment on column app.residential_prices.rate is 'Bubble residential_pricings.rate_number';
comment on column app.reviews.carer is 'Bubble review.carer_user (-> users)';
comment on column app.reviews.client is 'Bubble review.client_user (-> users)';
comment on column app.reviews.private is 'Bubble review.comment_text';
comment on column app.reviews.public is 'Bubble review.conduct_to_residents_text';
comment on column app.reviews.descriptors is 'Bubble review.descriptors_list_text';
comment on column app.reviews.late_time is 'Bubble review.late_time_number';
comment on column app.reviews.location is 'Bubble review.location_custom_location1 (-> locations)';
comment on column app.reviews.on_time is 'Bubble review.on_time_boolean';
comment on column app.reviews.rating is 'Bubble review.rating_number';
comment on column app.reviews.shift is 'Bubble review.shift_custom_shift (-> shifts)';
comment on column app.reviews.welcome is 'Bubble review.welcome_boolean';
comment on column app.risk_assessments.accidental_movement is 'Bubble risk_assessment.accidental_movement_list_option_accidental_movement (option set: accidental_movement)';
comment on column app.risk_assessments.accidental_movement_other is 'Bubble risk_assessment.accidental_movement_other_text';
comment on column app.risk_assessments.communication is 'Bubble risk_assessment.communication_text';
comment on column app.risk_assessments.environmental_risks is 'Bubble risk_assessment.environmental_risks_list_option_environmental (option set: environmental)';
comment on column app.risk_assessments.environmental_risks_other is 'Bubble risk_assessment.environmental_risks_other_text';
comment on column app.risk_assessments.financial_risks is 'Bubble risk_assessment.financial_risks_list_option_financial_risks (option set: financial_risks)';
comment on column app.risk_assessments.financial_risks_other is 'Bubble risk_assessment.financial_risks_other_text';
comment on column app.risk_assessments.health_safety_impact is 'Bubble risk_assessment.health_safety_impact_text';
comment on column app.risk_assessments.hr10 is 'Bubble risk_assessment.hr10_boolean';
comment on column app.risk_assessments.hr11 is 'Bubble risk_assessment.hr11_boolean';
comment on column app.risk_assessments.hr12 is 'Bubble risk_assessment.hr12_boolean';
comment on column app.risk_assessments.hr13 is 'Bubble risk_assessment.hr13_boolean';
comment on column app.risk_assessments.hr14 is 'Bubble risk_assessment.hr14_boolean';
comment on column app.risk_assessments.hr15 is 'Bubble risk_assessment.hr15_boolean';
comment on column app.risk_assessments.hr16 is 'Bubble risk_assessment.hr16_boolean';
comment on column app.risk_assessments.hr17 is 'Bubble risk_assessment.hr17_boolean';
comment on column app.risk_assessments.hr18 is 'Bubble risk_assessment.hr18_boolean';
comment on column app.risk_assessments.hr19 is 'Bubble risk_assessment.hr19_boolean';
comment on column app.risk_assessments.dangerous_visitors is 'Bubble risk_assessment.hr1_boolean';
comment on column app.risk_assessments.hr20 is 'Bubble risk_assessment.hr20_boolean';
comment on column app.risk_assessments.hr21 is 'Bubble risk_assessment.hr21_boolean';
comment on column app.risk_assessments.hr22 is 'Bubble risk_assessment.hr22_boolean';
comment on column app.risk_assessments.hr23 is 'Bubble risk_assessment.hr23_boolean';
comment on column app.risk_assessments.hr24 is 'Bubble risk_assessment.hr24_boolean';
comment on column app.risk_assessments.hr25 is 'Bubble risk_assessment.hr25_boolean';
comment on column app.risk_assessments.hr26 is 'Bubble risk_assessment.hr26_boolean';
comment on column app.risk_assessments.hr27 is 'Bubble risk_assessment.hr27_boolean';
comment on column app.risk_assessments.hr28 is 'Bubble risk_assessment.hr28_boolean';
comment on column app.risk_assessments.hr29 is 'Bubble risk_assessment.hr29_boolean';
comment on column app.risk_assessments.hr2 is 'Bubble risk_assessment.hr2_boolean';
comment on column app.risk_assessments.hr30 is 'Bubble risk_assessment.hr30_boolean';
comment on column app.risk_assessments.hr31 is 'Bubble risk_assessment.hr31_boolean';
comment on column app.risk_assessments.hr32 is 'Bubble risk_assessment.hr32_boolean';
comment on column app.risk_assessments.hr33 is 'Bubble risk_assessment.hr33_boolean';
comment on column app.risk_assessments.hr34 is 'Bubble risk_assessment.hr34_boolean';
comment on column app.risk_assessments.hr35 is 'Bubble risk_assessment.hr35_boolean';
comment on column app.risk_assessments.hr36 is 'Bubble risk_assessment.hr36_boolean';
comment on column app.risk_assessments.hr37 is 'Bubble risk_assessment.hr37_boolean';
comment on column app.risk_assessments.hr38 is 'Bubble risk_assessment.hr38_boolean';
comment on column app.risk_assessments.hr39 is 'Bubble risk_assessment.hr39_boolean';
comment on column app.risk_assessments.hr3 is 'Bubble risk_assessment.hr3_boolean';
comment on column app.risk_assessments.hr40 is 'Bubble risk_assessment.hr40_boolean';
comment on column app.risk_assessments.hr41 is 'Bubble risk_assessment.hr41_boolean';
comment on column app.risk_assessments.hr42 is 'Bubble risk_assessment.hr42_boolean';
comment on column app.risk_assessments.hr43 is 'Bubble risk_assessment.hr43_boolean';
comment on column app.risk_assessments.hr44 is 'Bubble risk_assessment.hr44_boolean';
comment on column app.risk_assessments.hr45 is 'Bubble risk_assessment.hr45_boolean';
comment on column app.risk_assessments.hr46 is 'Bubble risk_assessment.hr46_boolean';
comment on column app.risk_assessments.hr47 is 'Bubble risk_assessment.hr47_boolean';
comment on column app.risk_assessments.hr48 is 'Bubble risk_assessment.hr48_boolean';
comment on column app.risk_assessments.hr49 is 'Bubble risk_assessment.hr49_boolean';
comment on column app.risk_assessments.hr4 is 'Bubble risk_assessment.hr4_boolean';
comment on column app.risk_assessments.hr50 is 'Bubble risk_assessment.hr50_boolean';
comment on column app.risk_assessments.hr51 is 'Bubble risk_assessment.hr51_boolean';
comment on column app.risk_assessments.hr52 is 'Bubble risk_assessment.hr52_boolean';
comment on column app.risk_assessments.hr53 is 'Bubble risk_assessment.hr53_boolean';
comment on column app.risk_assessments.hr54 is 'Bubble risk_assessment.hr54_boolean';
comment on column app.risk_assessments.hr55 is 'Bubble risk_assessment.hr55_boolean';
comment on column app.risk_assessments.hr56 is 'Bubble risk_assessment.hr56_boolean';
comment on column app.risk_assessments.hr57 is 'Bubble risk_assessment.hr57_boolean';
comment on column app.risk_assessments.hr58 is 'Bubble risk_assessment.hr58_boolean';
comment on column app.risk_assessments.hr59 is 'Bubble risk_assessment.hr59_boolean';
comment on column app.risk_assessments.hr5 is 'Bubble risk_assessment.hr5_boolean';
comment on column app.risk_assessments.hr6 is 'Bubble risk_assessment.hr6_boolean';
comment on column app.risk_assessments.hr7 is 'Bubble risk_assessment.hr7_boolean';
comment on column app.risk_assessments.hr8 is 'Bubble risk_assessment.hr8_boolean';
comment on column app.risk_assessments.hr9 is 'Bubble risk_assessment.hr9_boolean';
comment on column app.risk_assessments.intake is 'Bubble risk_assessment.intake_custom_intake_form (-> intakes)';
comment on column app.risk_assessments.manual_handling is 'Bubble risk_assessment.manual_handling_list_option_manual_handling (option set: manual_handling)';
comment on column app.risk_assessments.manual_handling_other is 'Bubble risk_assessment.manual_handling_other_text';
comment on column app.risk_assessments.mental_health is 'Bubble risk_assessment.mental_health_list_option_mental_health (option set: mental_health)';
comment on column app.risk_assessments.nutrition is 'Bubble risk_assessment.nutrition_list_option_nutrition (option set: nutrition)';
comment on column app.risk_assessments.nutrition_other is 'Bubble risk_assessment.nutrition_other_text';
comment on column app.risk_assessments.other_risks is 'Bubble risk_assessment.other_risks_text';
comment on column app.risk_assessments.participant_signature is 'Bubble risk_assessment.participant_signature_image';
comment on column app.risk_assessments.participant is 'Bubble risk_assessment.participant_user (-> users)';
comment on column app.risk_assessments.personal_care is 'Bubble risk_assessment.personal_care_list_option_personal_care (option set: personal_care)';
comment on column app.risk_assessments.personal_contact is 'Bubble risk_assessment.personal_contact_text';
comment on column app.risk_assessments.persons_involved is 'Bubble risk_assessment.persons_involved_text';
comment on column app.risk_assessments.physical_health is 'Bubble risk_assessment.physical_health_list_option_physical_health (option set: physical_health)';
comment on column app.risk_assessments.physical_mobility is 'Bubble risk_assessment.physical_mobility_text';
comment on column app.risk_assessments.provider_timing is 'Bubble risk_assessment.provider_timing_text';
comment on column app.risk_assessments.reliance is 'Bubble risk_assessment.reliance_text';
comment on column app.risk_assessments.signature_date is 'Bubble risk_assessment.signature_date_date';
comment on column app.risk_assessments.social_risks is 'Bubble risk_assessment.social_risks_list_option_social_risks (option set: social_risks)';
comment on column app.risk_assessments.social_risks_other is 'Bubble risk_assessment.social_risks_other_text';
comment on column app.risk_assessments.sole_worker is 'Bubble risk_assessment.sole_worker_text';
comment on column app.risk_assessments.substance_use is 'Bubble risk_assessment.substance_use_list_option_substance_use (option set: substance_use)';
comment on column app.risk_assessments.substance_use_other is 'Bubble risk_assessment.substance_use_other_text';
comment on column app.risk_assessments.supervision_timing is 'Bubble risk_assessment.supervision_timing_text';
comment on column app.risk_management_plans.others is 'Bubble risk_management_plan.others_text';
comment on column app.risk_management_plans.participant is 'Bubble risk_management_plan.participant1_user (-> users)';
comment on column app.risk_management_plans.participant_impact is 'Bubble risk_management_plan.participant_impact_text';
comment on column app.risk_management_plans.person_responsible is 'Bubble risk_management_plan.person_responsible_text';
comment on column app.risk_management_plans.review_date is 'Bubble risk_management_plan.review_date_date';
comment on column app.risk_management_plans.risk is 'Bubble risk_management_plan.risk_text';
comment on column app.risk_management_plans.treatment is 'Bubble risk_management_plan.treatment_text';
comment on column app.service_agreements.participant_signature is 'Bubble service_agreement.participant_signature_image';
comment on column app.service_agreements.participant is 'Bubble service_agreement.participant_user (-> users)';
comment on column app.service_agreements.representative_signature is 'Bubble service_agreement.representative_signature_image';
comment on column app.service_agreements.representative is 'Bubble service_agreement.representative_text';
comment on column app.service_agreements.signed_date is 'Bubble service_agreement.signed_date_date';
comment on column app.service_agreements.support_1 is 'Bubble service_agreement.support_1_custom_support_arrangement (-> support_arrangements)';
comment on column app.service_agreements.support_2 is 'Bubble service_agreement.support_2_custom_support_arrangement (-> support_arrangements)';
comment on column app.service_agreements.support_3 is 'Bubble service_agreement.support_3_custom_support_arrangement (-> support_arrangements)';
comment on column app.service_agreements.support_4 is 'Bubble service_agreement.support_4_custom_support_arrangement (-> support_arrangements)';
comment on column app.service_agreements.support_5 is 'Bubble service_agreement.support_5_custom_support_arrangement (-> support_arrangements)';
comment on column app.shifts.abn is 'Bubble shift.abn_text';
comment on column app.shifts.accepted is 'Bubble shift.accepted_boolean';
comment on column app.shifts.address is 'Bubble shift.address_geographic_address';
comment on column app.shifts.attend_end is 'Bubble shift.attend_end_date';
comment on column app.shifts.attend_start is 'Bubble shift.attended_time_date';
comment on column app.shifts.booked_by is 'Bubble shift.booked_by_text';
comment on column app.shifts.cancelled is 'Bubble shift.cancelled_boolean';
comment on column app.shifts.carer is 'Bubble shift.carer_user (-> users)';
comment on column app.shifts.check_in_time is 'Bubble shift.check_in_time_date';
comment on column app.shifts.check_out_time is 'Bubble shift.check_out_time_date';
comment on column app.shifts.coordinator is 'Bubble shift.coordinator_user (-> users)';
comment on column app.shifts.csv is 'Bubble shift.csv_boolean';
comment on column app.shifts.date is 'Bubble shift.date_date';
comment on column app.shifts.duties is 'Bubble shift.duties_custom_shift_duties (-> shift_duties)';
comment on column app.shifts.end_time is 'Bubble shift.end_time_number';
comment on column app.shifts.attended is 'Bubble shift.expired_boolean';
comment on column app.shifts.fee is 'Bubble shift.fee_number';
comment on column app.shifts.gst_code is 'Bubble shift.gst_code_text';
comment on column app.shifts.hours is 'Bubble shift.hours_number';
comment on column app.shifts.incident is 'Bubble shift.incident_custom_incident (-> incidents)';
comment on column app.shifts.invoice is 'Bubble shift.invoice_custom_invoice (-> invoices)';
comment on column app.shifts.invoiced is 'Bubble shift.invoiced_boolean';
comment on column app.shifts.location is 'Bubble shift.location_custom_location1 (-> locations)';
comment on column app.shifts.ndis_pricing is 'Bubble shift.ndis_custom_ndis_pricing (-> ndis_price_items)';
comment on column app.shifts.needs_invoice is 'Bubble shift.needs_invoice_boolean';
comment on column app.shifts.notes is 'Bubble shift.notes_text';
comment on column app.shifts.participant is 'Bubble shift.participant_user (-> users)';
comment on column app.shifts.progress_note is 'Bubble shift.progress_note_custom_progress_notes (-> progress_notes)';
comment on column app.shifts.rate is 'Bubble shift.rate_number';
comment on column app.shifts.receipts is 'Bubble shift.receipts_list_file';
comment on column app.shifts.receipts_total is 'Bubble shift.receipts_total_number';
comment on column app.shifts.recurring is 'Bubble shift.recurring_text';
comment on column app.shifts.registration is 'Bubble shift.registration_text';
comment on column app.shifts.reporting is 'Bubble shift.reporting_custom_reporting (-> wintringham_reports)';
comment on column app.shifts.res_pricing is 'Bubble shift.res_pricing__custom_residential_pricings (-> residential_prices)';
comment on column app.shifts.revenue is 'Bubble shift.revenue_number';
comment on column app.shifts.roles is 'Bubble shift.roles_list_option_roles (option set: roles)';
comment on column app.shifts.start_time is 'Bubble shift.start_time_number';
comment on column app.shifts.supervisor is 'Bubble shift.supervisor_text';
comment on column app.shifts.time is 'Bubble shift.time_option_shift_time (option set: shift_time)';
comment on column app.shifts.wage is 'Bubble shift.wage_number';
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
comment on column app.shift_logs.shift is 'Bubble shift_logs.shift_custom_shift (-> shifts)';
comment on column app.shift_logs.start_location is 'Bubble shift_logs.start_location_geographic_address';
comment on column app.shift_logs.time is 'Bubble shift_logs.time_text';
comment on column app.missed_shifts.date is 'Bubble shifts_missed.date_date';
comment on column app.missed_shifts.location is 'Bubble shifts_missed.location_custom_location1 (-> locations)';
comment on column app.missed_shifts.rate is 'Bubble shifts_missed.rate_custom_residential_pricings (-> residential_prices)';
comment on column app.missed_shifts.reason is 'Bubble shifts_missed.reason_text';
comment on column app.missed_shifts.shift is 'Bubble shifts_missed.shift_option_shift_time (option set: shift_time)';
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
comment on column app.superannuation.tfn is 'Bubble superannuation.tfn_custom_tax_file_number_declaration (-> tfn_declarations)';
comment on column app.superannuation.fund_usi is 'Bubble superannuation.usi_text';
comment on column app.support_arrangements.hours is 'Bubble support_arrangement.hours_number';
comment on column app.support_arrangements.ndis_pricing is 'Bubble support_arrangement.ndis_pricing_custom_ndis_pricing (-> ndis_price_items)';
comment on column app.support_arrangements.no is 'Bubble support_arrangement.no___number';
comment on column app.support_arrangements.participant is 'Bubble support_arrangement.participant_user (-> users)';
comment on column app.support_arrangements.service_agreement is 'Bubble support_arrangement.service_agreement_custom_service_agreement (-> service_agreements)';
comment on column app.support_arrangements.total is 'Bubble support_arrangement.total_number';
comment on column app.support_plans.emerging_health is 'Bubble support_plan.emerging_health_text';
comment on column app.support_plans.gp is 'Bubble support_plan.gp_text';
comment on column app.support_plans.participant_signature is 'Bubble support_plan.participant_signature_image';
comment on column app.support_plans.participant is 'Bubble support_plan.participant_user (-> users)';
comment on column app.support_plans.signed_date is 'Bubble support_plan.signed_date_date';
comment on column app.support_plans.urgent_health is 'Bubble support_plan.urgent_health_text';
comment on column app.participant_surveys.additional_questions is 'Bubble survey.additional_questions_text';
comment on column app.participant_surveys.age is 'Bubble survey.age_text';
comment on column app.participant_surveys.comments is 'Bubble survey.comments_text';
comment on column app.participant_surveys.complaints is 'Bubble survey.complaints_text';
comment on column app.participant_surveys.completing_survey is 'Bubble survey.completing_survey_text';
comment on column app.participant_surveys.gender is 'Bubble survey.gender_text';
comment on column app.participant_surveys.identity is 'Bubble survey.identity_list_text';
comment on column app.participant_surveys.individual_treatment is 'Bubble survey.individual_treatment_text';
comment on column app.participant_surveys.location is 'Bubble survey.location_text';
comment on column app.participant_surveys.ndis_hours_weekly is 'Bubble survey.ndis_hours_weekly_text';
comment on column app.participant_surveys.ndis_plan_understanding is 'Bubble survey.ndis_plan_understanding_text';
comment on column app.participant_surveys.ndis_services is 'Bubble survey.ndis_services_list_text';
comment on column app.participant_surveys.opinion_rating is 'Bubble survey.opinion_rating_text';
comment on column app.participant_surveys.participant is 'Bubble survey.participant_user (-> users)';
comment on column app.participant_surveys.privacy_respect is 'Bubble survey.privacy_respect_text';
comment on column app.participant_surveys.respect_of_rights is 'Bubble survey.respect_of_rights_text';
comment on column app.participant_surveys.satisfaction is 'Bubble survey.satisfaction_text';
comment on column app.participant_surveys.support_based is 'Bubble survey.support_based_text';
comment on column app.participant_surveys.three_bads is 'Bubble survey.three_bads_text';
comment on column app.participant_surveys.three_changes is 'Bubble survey.three_changes_text';
comment on column app.participant_surveys.three_goods is 'Bubble survey.three_goods_text';
comment on column app.participant_surveys.your_contact is 'Bubble survey.your_contact_text';
comment on column app.swann_bookings.date is 'Bubble swann.date_date';
comment on column app.swann_bookings.email is 'Bubble swann.email_text';
comment on column app.swann_bookings.end_time is 'Bubble swann.end_time_text';
comment on column app.swann_bookings.location is 'Bubble swann.location_text';
comment on column app.swann_bookings.name is 'Bubble swann.name_text';
comment on column app.swann_bookings.phone_number is 'Bubble swann.phone_number_text';
comment on column app.swann_bookings.platform is 'Bubble swann.platform_text';
comment on column app.swann_bookings.start_time is 'Bubble swann.start_time_text';
comment on column app.review_tags.tag_name is 'Bubble tags.tag_name_text';
comment on column app.tfn_declarations.carer is 'Bubble tax_file_number_declaration.carer_user (-> users)';
comment on column app.tfn_declarations.student_loan_debt is 'Bubble tax_file_number_declaration.education_loan_debt_boolean';
comment on column app.tfn_declarations.signature is 'Bubble tax_file_number_declaration.signature1_image';
comment on column app.tfn_declarations.tax_free_threshold is 'Bubble tax_file_number_declaration.tax_free_threshold_boolean';
comment on column app.tfn_declarations.tax_file_number is 'Bubble tax_file_number_declaration.tfn_text';
comment on column app.tfn_declarations.working_rights is 'Bubble tax_file_number_declaration.working_rights_text';
comment on column app.threads.name is 'Bubble thread.name_text';
comment on column app.unanswered_questions.answered is 'Bubble unanswered.answered_boolean';
comment on column app.unanswered_questions.question is 'Bubble unanswered.question_text';
comment on column app.unanswered_questions.questioner is 'Bubble unanswered.questioner_custom_thread (-> threads)';
comment on column app.vaccinations.carer is 'Bubble vaccinations.carer_user (-> users)';
comment on column app.vaccinations.covid19 is 'Bubble vaccinations.covid19_list_file';
comment on column app.vaccinations.expiry is 'Bubble vaccinations.expiry_date';
comment on column app.vaccinations.flu is 'Bubble vaccinations.flu_file';
comment on column app.vaccinations.influenza is 'Bubble vaccinations.influenza_list_file';
comment on column app.videos.video is 'Bubble video.video_file';
comment on column app.wwcc_checks.approved is 'Bubble working_with_children_check.approved_boolean';
comment on column app.wwcc_checks.image is 'Bubble working_with_children_check.card_image_file';
comment on column app.wwcc_checks.card_number is 'Bubble working_with_children_check.card_number_text';
comment on column app.wwcc_checks.carer is 'Bubble working_with_children_check.carer_user (-> users)';
comment on column app.wwcc_checks.expiry is 'Bubble working_with_children_check.expiry_date';
comment on column app.wwcc_checks.state is 'Bubble working_with_children_check.state_text';
