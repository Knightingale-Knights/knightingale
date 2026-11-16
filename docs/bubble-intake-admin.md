# Knightingale Bubble app: `intake_admin` page (technical handover)

**App:** Bubble `florence-26575` (Knightingale, knightingale.com.au)
**Page:** `intake_admin`
**Status:** Built in the **development version only**. It has **not** been deployed to live and has not yet had a full test save.
**Preview:** https://florence-26575.bubbleapps.io/version-test/intake_admin
**Rules:** Work only in development. Never deploy to live unless Paul asks. Don't change other pages. Participant data is private (NDIS Practice Standards, Privacy Act), so never copy real participant data into docs, logs or messages.

---

## 1. Purpose

The page lets an admin pick a participant and fill in or edit:
1. **The Intake form** (all intake questions), through `IntakePopup`.
2. **The Knightingale staff questions** (Home Safety and Risk Assessment), through `StaffPopup`.

Each popup writes straight into the participant's linked database record. If the participant doesn't have a record yet, the popup creates one and links it.

---

## 2. Data model (as used by this page)

| Type | Link from User | Back-link | Notes |
|---|---|---|---|
| `User` | — | — | The participant. Fields used: `account type` (option set, `participant` / `admin`), `active` (text "yes"), `account status` (text "yes"), `first name`, `last name`, `intake form`, `home safety`, `risk assessment` |
| `Intake` | `User.intake form` (single Intake) | `Intake.participant` (User) | Note: the type is called **Intake**, not `intake_form` |
| `Home Safety` | `User.home safety` (single) | `Home Safety.participant` (User) | |
| `Risk Assessment` | `User.risk assessment` (single) | `Risk Assessment.participant` (User) | Also has `intake`, `participant signature` (image), `signature date`, and `risk management plan` (list of Risk Management Plan) |

Option sets used:
- **Safety Check**: safe / unsafe / n/a (33 Home Safety fields)
- **Answer**: Yes / No / Unknown (12 Home Safety hazard fields)
- Risk Assessment list fields each use their own option set: accidental movement, environmental risks, financial risks, manual handling, mental health, nutrition, personal care, physical health, social risks, substance use.

Plugins used:
- **Multiselect Dropdown** (element "Multi dropdown"). Used for list fields, which are saved with *set list*.
- **Signature Pad**. Saved with the "Save a Signature Pad" action, then the pad's *Image url* is stored.
- **Search Box with Geographic places**. Used for addresses (the Google Maps and Geocode keys are already set in the app).

---

## 3. Page-level elements and workflows

### Page is loaded (access control)
- Condition: the user is logged out **or** their `account type` is not `admin`.
- Action: **Go to page `index`**. (The editor shows a harmless "Data to send" warning on this step.)

### `ParticipantDropdown` (page level, outside both popups)
- Type: User.
- Choices source: `Search for Users` where `account type = participant`, `active = "yes"` and `account status = "yes"`.
- Caption: `first name` + " " + `last name`.
- Both popups read the selected participant from `ParticipantDropdown's value`.

### Buttons
- `Open intake`: shows `IntakePopup`.
- `Open staff questions`: shows `StaffPopup`.

---

## 4. `IntakePopup` (the Intake form)

- Contains `Group Intake`. Type of content is **Intake**, and the data source is `ParticipantDropdown's value's intake form`.
- Every input's initial content is `Parent group's Intake's <field>`, so existing answers load into the form.
- Input naming: `In_<field name>`. Multiselects use underscores, for example `In_consent` and `In_manual_handling`.
- Inputs:
  - 48 multiline text inputs (text fields)
  - 7 dropdowns (option-set fields)
  - 7 multiselects (list fields)
  - Plan manager input
  - Signature date (date picker)
  - 2 Search Box address inputs (geographic address fields)
  - 3 Signature Pads: participant, representative, Knightingale

### Workflow: "Save intake" button is clicked
1. **Create a new Intake**. *Only when* `ParticipantDropdown's value's intake form is empty`. Sets `participant = ParticipantDropdown's value`.
2. **Make changes to User** (`ParticipantDropdown's value`): `intake form = Result of step 1`. *Same condition as step 1.*
3. **Save participant signature pad**. *Only when* that pad's image is not empty.
4. **Save representative signature pad**. *Same condition.*
5. **Save Knightingale signature pad**. *Same condition.*
6. **Make changes to Intake** (`ParticipantDropdown's value's intake form`). **69 fields** set from the `In_*` inputs. Multiselects use *set list*, and signatures use the saved pad image URLs from steps 3 to 5.
7. **Hide `IntakePopup`**.

---

## 5. `StaffPopup` (Knightingale staff questions)

### `Group HomeSafety`
- Type: **Home Safety**. Data source: `ParticipantDropdown's value's home safety`.
- 46 inputs named `HS_<field name>`:
  - 33 dropdowns using **Safety Check**
  - 12 dropdowns using **Answer**
  - `HS_home safety notes` (multiline text)

### `Group Risk`
- Type: **Risk Assessment**. Data source: `ParticipantDropdown's value's risk assessment`.
- 17 multiline text inputs named `RA_<field name>`.
- `RA_dangerous visitors` (checkbox, yes/no).
- 10 multiselects named with underscores: `RA_accidental_movement`, `RA_environmental_risks`, `RA_financial_risks`, `RA_manual_handling`, `RA_mental_health`, `RA_nutrition`, `RA_personal_care`, `RA_physical_health`, `RA_social_risks`, `RA_substance_use`.

### Workflow: "Save staff questions" button is clicked
1. **Create a new Home Safety**. *Only when* the participant's `home safety` is empty. Sets `participant`.
2. **Make changes to User**: `home safety = Result of step 1` (same condition).
3. **Make changes to Home Safety** (participant's home safety). 46 rows, one per `HS_*` input.
4. **Create a new Risk Assessment**. *Only when* the participant's `risk assessment` is empty. Sets `participant`.
5. **Make changes to User**: `risk assessment = Result of step 4` (same condition).
6. **Make changes to Risk Assessment**. 28 rows: 17 text fields, `dangerous visitors = RA_dangerous visitors is checked`, and 10 *set list* rows from the multiselects.
7. **Hide `StaffPopup`**.

### Deliberately not included
- `risk management plan` (a list of the Risk Management Plan type). It needs its own design.
- `hr2` to `hr59` (yes/no fields whose question wording is unclear). These are waiting on Paul.
- The Knightingale signature isn't repeated here because it's already captured in `IntakePopup`.

---

## 6. Where data is saved: quick reference

| Popup | Saves to | Found via |
|---|---|---|
| IntakePopup | `Intake` record | `User.intake form` / `Intake.participant` |
| StaffPopup, Home Safety section | `Home Safety` record | `User.home safety` / `Home Safety.participant` |
| StaffPopup, Risk section | `Risk Assessment` record | `User.risk assessment` / `Risk Assessment.participant` |
| Signatures | Image URLs on the `Intake` record | Signature Pad save actions |

---

## 7. Known issues and gotchas

- **Existing editor warnings not related to this page:** 24 "Postmark - Progress Notes" issues in the HMAM reusable element's "Button SEND is clicked" workflow (the subject, progress_note and base64_file_content fields are empty). They were there before this work, probably from a plugin update, and haven't been fixed. Waiting on Paul.
- **Editor behaviour when making changes:**
  - The editor lags. Do one action at a time.
  - Click picker matches rather than pressing Enter.
  - Avoid Ctrl+A.
  - Wait about 8s between duplicates.
  - Stray "+" clicks can add empty rows or remove existing ones.
  - Saves can time out, so audit the field rows after each batch.
- If `ParticipantDropdown` is ever deleted or renamed, every group data source and workflow step that references it breaks and has to be re-pointed.

## 8. Testing checklist
1. Open the preview while logged in as an admin.
2. Pick a test participant (active and account status both "yes").
3. Open intake, change a few fields, add a signature, then save. Reopen it and check the changes stuck.
4. Open staff questions, change a few dropdowns, a text field, the checkbox and a multiselect, then save. Reopen and check.
5. Test with a participant who has no Intake, Home Safety or Risk Assessment yet, to confirm records get created and linked.
6. Deploy to live **only** when Paul says so.
