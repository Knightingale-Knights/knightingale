# Bubble participant sections (observed 17 Nov 2026)
Participant card: name, coordinator email under it, 18 buttons. Page also has "Search Participants" and "Admin Intake" button.
- About: popup "All About <name>", one long text box, SAVE, download icon.
- Carers: popup list of assigned carers (photo, name, Profile button, remove x), carer search input + ADD.
- Consent: popup "<name> Privacy Consent Form": long text (saved consent.txt), checkboxes of consent options, sharing fields, signatures: Consent options [Government Agencies, NDIS Audits, Social Media, Website, None of the Above], participant signature + date, Knightingale signature + date, SAVE.
- Documents: popup "<name>'s Documents": "Please select a document", one button per document (e.g. Physio Exercises), Close.
- Emergency: popup "<name> Emergency Plan", download icon, fields:
  Full Name, Gender {M/F/O: Male|Female|No Preference}, D.O.B, Address (geo), Phone, Email, Contact Preference {Phone|SMS|Face to Face|Email|Mail|Social Media|Lots of Reminders|Through Support Coordinator|Zoom|Do Not Communicate With Me},
  NDIS Number, NDIS Funding {Self Managed|Plan Managed|NDIA Managed}, Plan Manager (geo/text), Plan Manager Email, Plan Manager Phone, NDIS Plan Start, NDIS Plan End,
  Communication: Preferred Communication Type {Verbal|Non-Verbal|Aids Required|other}, Spoken Languages, Interpreter Requirements? {Yes|No},
  Emergency Contact Details: Primary + Secondary contact each: type {advocate|guardian|emergency contact|parent|support person|plan nominee|other|none}, Name, Relationship, Address, Phone, Email, Advocacy Form {Yes|No},
  Physical Health: Dr's Name & Phone, Pharmacist Name & Phone, Physical Conditions (multi: None|Allergies|Arthritis|Asthma|...), Allergies, Medications,
  Mental Health: Conditions (multi: None|ABI|Auditory Hallucinations|Depression|...), Medications,
  Requirements: Mobility Aids (multi: None|Falls Risk|Independent|Manual Assist|Manual Hoist|Shower Chair|Walking Frame|Walking Stick|Wheelchair|Other), Diet, Living Situation {Own home (alone)|Own home (family)|+5},
  Emergency Procedures: Fire Evacuation Route & Meeting Location, Fire Steps & Emergency Contact, Preferred Hospital & Instructions, Hospital Steps & Emergency Contact, Natural Disaster Evacuation Plan, Natural Disaster Steps & Emergency Contact, Infectious/Hazardous Isolation Procedure, Infectious/Hazardous Steps & Emergency Contact, Backup Power & Emergency Lighting, Power Outage Steps & Emergency Contact,
  Emergency Evacuation Kit: Consent (multi Government Agencies|NDIS Audits|Social Media|Website|None of the Above), Plan Review Date, participant signature + date, Knightingale signature, Representative Name + date, SAVE.
- Feedback: clicking did nothing visible for Allen Vincent (maybe opens a new tab, or nothing). ASK PAUL.
- Funding: popup "<name>'s Funding", a list (empty for Allen). Likely the NDIS funding dashboard (quarterly allocation / burn rate).
- Group Chat: popup "<name> Group Chat": intro "Share info about participants. Any tasks they need done on the next shift. Any bits of info you think might help the next carer." message list + composer. (Already built in new app.)
- Incident Reports: replaces the button list inline with a list box (empty for Allen).
- Info Book: popup "Knightingale Information Booklet": static booklet (text saved in infobook.txt), signatures at end: participant signature + Participant name + Date, Knightingale signature + name + Date, CLOSE, download icon.
- Intake Form: popup "<name> Intake Form", download icon. Same top block as Emergency (Full Name..NDIS Plan End), then
  Personal Details: Aboriginal/Torres Strait Islander {sel}, Culture/Diversity/Values/Beliefs, Living situation {sel 8}, Behaviour support plan? {sel}, Primary NDIS diagnosis, Secondary diagnosis, Other relevant info, Hobbies.
  Representative; Emergency Contact 1 & 2 (type sel, Name, Relationship, Address, Phone, Email, Advocacy Form sel).
  Communication: Preferred Communication {sel}, Languages, Interpreter {sel}.
  Health: Diagnosis, Physical Health Diagnosis (multi, 42 options), Mental Health Diagnosis (multi, 20), Medication List, Medication Assistance, Hospital Admissions {sel}, Hospital Stays.
  Diet: Dietary Requirements List, Vegetarian/Vegan/Dairy/Gluten Free {Yes/No}, Allergies, Food You Don't Like, Favourite Food.
  Practical Support Needs: Daily Tasks, Mobility Aids (multi), Manual Handling Assistance (multi), Personal Care Assistance (multi: None|Bathing|Dental Hygiene|Dressing|Feeding|Grooming|Shaving|Showering|+3), Support Necessary (multi: Daily Personal Activities|Travel/Transport|Managing Life Stages/Transitions|Community Participation|Life Skills/Daily Living Development|Housework|Participate in Community/Social/Civic Activities|Meal Prep), Any Other Assistance.
  Carer Preferences (optional): Age, Gender, Culture/Religion/Ethnicity, Languages Spoken, Personality Type, Unique Skills/Knowledge, Specific Training, Any Other Info.
  Goals, Expectations, Outcomes: 12mth Goals.
  Consent multi, participant signature (pad: Sign above / Clear / Save) + name + date, representative signature + name + date, ...
- Progress Notes: inline list of notes by date (13/11, 11/11...) each with OPEN -> popup "<name>'s Progress Note" multi-step (Summary textarea + NEXT ...). Use app.progress_notes columns for the rest.
- Risk Assessment: popup "<name> Risk Assessment", download icon.
  Participant: Full Name, D.O.B, Address, Phone.
  Personal Details: Preferred Communication, Communicability {sel 4}, Cultural Considerations, Religion/Spirituality, Interests.
  Medical Conditions: Mental Health, Physical Health, Physical Mobility {sel 4}, Allergies.
  Emergency Contact 1 & 2 (as intake).
  Consent: Participant Involvement, Privacy Policy.
  Living Alone: Sole Support Worker, Outside Contact {sel 4}, Reliance on our service, Disruption Impact.
  Risk Factors (multi tags): Medical Conditions (42), Personal Care (11), Eating/Drinking (21), Accidental Movement (12), Manual Handling (7), Environmental (12), Mental Health (20), Financial (9), Social Risks (23), Substance Use (6), Other Risks text.
  Home Risks grid Safe/Unsafe/N/A for: Bathroom Access, Bathroom Drainage, Bathroom Ventilation, Bed Height, Bed Space Sufficient, Cleaning Products, Cleaning Products Storage, Clothesline, Door Access, Electrical Equipment, Electrical Leads, Floor Surfaces, Food Prep Equipment, Fridge/Freezer, Furniture Placement, Gates, Laundry Drainage, Laundry Ventilation, Lighting, Parking, Pathway Garden, Portable Heaters, Power Points, Room To Move Safely, Stairs, Stove, Switches/Plugs, Tables/Chairs, Vacuum, Verandah, Walking Aids Access, Washer/Dryer.
  Grid Yes/No/N/A for: Dangerous Visitors, Doors Locked, Exposed Gas Cylinders, Faulty Smoke Detectors, Hoarding, Infectious Disease, Manual Handling, Pests, Pets, Power Points Near Water, Restraint Used, Smoker In Home, Weapons.
  Monitoring & Supervision Plan: 3 selects.
  Risk Management Plan: rows of Risk Type, Participant Impact {sel}, Others Impact {sel}, Person Responsible, Review Date, GENERATE (AI risk treatment), Risk Treatment text, SAVE; existing rows listed (e.g. Depression / Med / Low / Paul).
- Service Agreement: popup "<name> Service Agreement", download icon. Parties (participant name, address, NDIS# inputs; Knightingale ABN/address; commence date), long static sections: Purpose, Definitions, Supports And Services, Consent, Knightingale's Responsibilities, Participant Responsibilities, Fees For Services, Payments, GST, Cancellation And No Show Policy, Terminating This Agreement, Complaints And Feedback, Emergency And Disaster Management (capture text with get_page_text when building).
  Schedule of Supports: rows: support (NDIS item select), Support Item No#, Name, Hours, Hourly Rate, Annual Total; SAVED/DELETE per row, Add Support.
  Signatures: Consent multi, participant signature/name/date, Knightingale signature/name/date.
- Shift Duties: popup "<name>'s Points of Care": "Please use this as a guide for the shift. Mark off or add any tasks you complete." checklist items with remove x, text input + ADD.
- Summary: clicking showed a progress bar and no popup (runs a workflow; probably the monthly support summary deck). ASK PAUL whether that sent anything.
- Support Plan: popup "<name> Support Plan", download icon. Sections: identity (Full Name, Gender, DOB, Address, Phone, Email, contact preference, NDIS number, funding type, plan manager + email + phone, plan start/end),
  Personal Details (Aboriginal/TSI, Culture/Values, Living Situation, BSP, Primary/Secondary diagnosis, Any Legal Issues, Other Relevant Info, Medical Team Contacts),
  Emergency Contacts #1, #2 (optional), EMERGENCY PLAN,
  Communication (method, type, spoken languages, interpreter),
  Physical Health (diagnosis, medications, medication assistance, express emerging health concerns, escalate urgent health situations),
  Mental Health (diagnosis, medications, hospital admissions, staying out of hospital),
  Diet (requirements, vegetarian, vegan, dairy free, gluten free, allergies, least favourite, favourite),
  Practical Support Needs (daily support, mobility aids, manual handling, personal care, support needed, we can best assist you),
  Your Preferences (carer age, gender, cultural/religious/ethnic, spoken language, personality, unique skills, specific training, anything else),
  Goals (12 month goals),
  ADMIN (completed with participant, may we substitute workers, risk assessment, consent, scheduled review date), signatures, SAVE.
- Survey: popup "NDIS SURVEY": (box at top, maybe list of past surveys), Identify as (multi: Aboriginal or TSI | non-English speaking background | living with disability | LGBTIQA+ / preferred pronouns | Forgotten Australian (Care Leaver) | veteran | +2), Location {Community|Residential Aged Care (RAC)}, Age group {45-54|55-64|65-74|75-84|85+}, Gender {Female|Male|Non-binary|Prefer not to say|Prefer to self describe}, Services received (multi: Accessing the community for appointments and shopping|Home Care|Personal Care|Recreation|Support Coordination), Hours of NDIS core services/week {0|1-5|6-10|11-15|16-20|+3}, Completing as {client|on behalf of client|family member|+1},
  5-point ratings: plan explained, support based on what you want, treated as individual, privacy respected, satisfied with services, satisfied with rights respected;
  text: complaints, three things done well, three not so well, three you'd change, questions I didn't ask.
- Admin Intake (button above the list): not opened yet.

## Matching tables in the app schema
consents (41), emergency_plans (44), intakes (52), risk_assessments (26) + risk_management_plans (104), service_agreements (38) + support_arrangements (49, schedule rows), shift_duties (165), support_plans (29), participant_surveys (1), participant_documents (38), incidents (11), progress_notes (4534), info_book_signoffs (29), feedback (0), ndis_quarters (0, funding), group_chats (37). About = users.about (check column).

## Admin Intake (page /intake_admin/<admin user id>, built by Grok)
Top: "Open intake", "Open staff questions", and a participant dropdown (34 participants).

### Open intake (popup), one form, raw field names as placeholders
Selects: participant (top), gender {Male|Female|...}, contact preference {Phone|SMS|...}, communication type {Verbal|Non-Verbal|...}, contact1 type + contact2 type {advocate|guardian|...}, living situation {Own home (alone)|Own home (family)|...}, NDIS funding {Self Managed|Plan Managed|...}, consent (multi: NDIS Audits|Social Media|Website...), plan manager {Plan Partners|My Plan Manager|... from plan_managers}.
Text: aborigin, contact1 name/relation/phone/email/advocacyform, contact2 name/relation/phone/email/advocacyform, dairy, interpreter, vegetarian, vegan, gluten, allergies, 7 x "Type here..." boxes, carer training, cultural values, diet requirements, dont eat, favourite food, goals, hospital admission assistance, hospital admission history, language, legal issues, medication assistance, medications, mental medications, other info, outcomes, physical medications, primary diagnosis, religion, secondary diagnosis, support needs, twelve month goals, unique you.
Multi-tags: manual handling (Mobility|Moving In Bed|Personal Care...), mental health (ABI|Auditory Hallucinations|Depression...), mobility aids (Falls Risk|Independent|Manual Assist...), personal care (Bathing|Dental Hygiene|Dressing...), physical conditions (Allergies|Arthritis|Asthma...), support needed (Travel/Transport|Managing Life Stages/Transitions|Community...).
Date (today), 2 address inputs ("Start typing..."), 3 signature pads (Clear/Save each), "Save intake".

### Open staff questions (popup "Knightingale staff questions")
home safety notes; Home Safety selects {safe|unsafe|n/a}: bathroom access, bathroom drainage, bathroom ventilation, bed height, bed space, cleaning products, cleaning products storage, clothesline, door access, electrical equipment, electrical leads, floor surfaces, food prep equipment, fridge freezer, furniture placement, gates, laundry drainage, laundry ventilation, lighting, manual handling, parking, pathway garden, portable heaters, power points, room to move, stairs, stove, switches plugs, tables chairs, vacuum, verandah, walking aid access, washer dryer.
{Yes|No|Unknown}: dangerous visitors, doors locked, exposed gas cylinders, faulty smoke detectors, hoarding, infectious disease, pests, pets, power points near water, restraint used, smoker in home, weapons.
Risk multi-tags (each with "None" + options and an "other" text): accidental movement (Bumping|Falling|Grabbing|Holding|Leaning...), environmental (Absconding|Electrocution|Fire|Poisons...), financial (Challenges Budgeting|Debt|Financially Exploited...), manual handling (Mobility|Moving In Bed|Personal Care|Transfers...), mental health (ABI|...), nutrition/eating (Alertness|Allergies|Behaviours|Choking...), personal care (Bathing|...), medical (Allergies|Arthritis|...), social (Anti-Social Peers|Criminal Behaviour|...), substance use (Alcohol|Drugs|Medication Misuse|Smoking...).
Text: health/safety impact, other risks, personal contact, persons involved, physical mobility, provider timing, reliance, sole worker, supervision timing, communication; a checkbox; date (Today); "Save staff questions".
These map onto the Risk Assessment and home_safety records.
