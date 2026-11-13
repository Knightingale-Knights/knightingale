#!/usr/bin/env python3
"""Generate the Supabase `app` schema from a Bubble .bubble export.

Usage: python3 scripts/gen_schema.py path/to/app.bubble

Writes:
  supabase/migrations/20261114000000_app_schema.sql
  supabase/migrations/20261114000001_option_values.sql
  supabase/bubble_map.json   (Bubble type/field keys -> table/column, for data migration)

Never commit the .bubble export itself: it contains live API keys.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIG = ROOT / "supabase" / "migrations"

RESERVED = {
    "all", "analyse", "analyze", "and", "any", "array", "as", "asc", "both", "case", "cast",
    "check", "collate", "column", "constraint", "create", "current_date", "current_role",
    "current_time", "current_timestamp", "current_user", "default", "deferrable", "desc",
    "distinct", "do", "else", "end", "except", "false", "fetch", "for", "foreign", "from",
    "grant", "group", "having", "in", "initially", "intersect", "into", "lateral", "leading",
    "limit", "localtime", "localtimestamp", "not", "null", "offset", "on", "only", "or",
    "order", "placing", "primary", "references", "returning", "select", "session_user",
    "some", "symmetric", "table", "then", "to", "trailing", "true", "union", "unique", "user",
    "using", "variadic", "when", "where", "window", "with",
}
# Columns every table gets; Bubble fields may not reuse these names.
SYSTEM_COLS = {"id", "bubble_id", "created_at", "updated_at", "created_by"}

SCALAR = {
    "text": "text",
    "number": "numeric",
    "boolean": "boolean",
    "date": "timestamptz",
    "image": "text",
    "file": "text",
    "geographic_address": "jsonb",
    "date_range": "tstzrange",
    "number_range": "numrange",
}

TABLE_RENAME = {
    "user": "users",
    "calls": "shift_calls",
    "care_culture": "care_culture_checklists",
    "client": "billing_clients",
    "comms_book": "group_chats",
    "consent": "consents",
    "cpr1": "cpr_certificates",
    "document": "participant_documents",
    "emergency_plan": "emergency_plans",
    "esw": "esw_logs",
    "event": "events",
    "first_aid": "first_aid_certificates",
    "food_fluid": "food_fluid_logs",
    "handbook": "handbook_acknowledgements",
    "health_profile": "health_profiles",
    "id1": "identity_documents",
    "incident": "incidents",
    "info_book": "info_book_signoffs",
    "intake_form": "intakes",
    "interests": "carer_interests",
    "invoice": "invoices",
    "location1": "locations",
    "login": "location_logins",
    "medication_chart": "medication_charts",
    "message": "messages",
    "metrics": "marketing_metrics",
    "ndis": "ndis_screening_checks",
    "ndis_pricing": "ndis_price_items",
    "ndis_quarter": "ndis_quarters",
    "payslip": "payslips",
    "plan_manager": "plan_managers",
    "police_check": "police_checks",
    "questionnaire_session": "questionnaire_sessions",
    "quote": "quotes",
    "recurring": "recurring_shifts",
    "reporting": "wintringham_reports",
    "residential_pricings": "residential_prices",
    "review": "reviews",
    "risk_assessment": "risk_assessments",
    "risk_management_plan": "risk_management_plans",
    "service_agreement": "service_agreements",
    "shift": "shifts",
    "shifts_missed": "missed_shifts",
    "support_arrangement": "support_arrangements",
    "support_plan": "support_plans",
    "survey": "participant_surveys",
    "swann": "swann_bookings",
    "tags": "review_tags",
    "tax_file_number_declaration": "tfn_declarations",
    "thread": "threads",
    "unanswered": "unanswered_questions",
    "video": "videos",
    "working_with_children_check": "wwcc_checks",
}


def snake(s: str) -> str:
    s = re.sub(r"\s*-\s*deleted\s*$", "", s.strip(), flags=re.I)
    s = re.sub(r"[^a-zA-Z0-9]+", "_", s).strip("_").lower()
    if not s:
        s = "field"
    if s[0].isdigit():
        s = "f_" + s
    return s


def col_name(raw: str, used: set) -> str:
    n = snake(raw)
    if n in RESERVED:
        n += "_value"
    if n in SYSTEM_COLS:
        n = "id_document" if n == "id" else n + "_field"
    base, i = n, 2
    while n in used:
        n = f"{base}_{i}"
        i += 1
    used.add(n)
    return n


def lit(v, pgtype):
    if v is None:
        return None
    if pgtype == "boolean":
        return "true" if v else "false"
    if pgtype == "numeric" and isinstance(v, (int, float)):
        return str(v)
    if pgtype == "text" and isinstance(v, (str, int, float)):
        return "'" + str(v).replace("'", "''") + "'"
    return None


def q(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def main(export_path: str):
    d = json.load(open(export_path))
    types = d["user_types"]
    live = {k: v for k, v in types.items() if not v.get("deleted") and v.get("fields") is not None}
    # Drop types with no live fields (empty shells in Bubble), but always keep user.
    def live_fields(t):
        return {fk: f for fk, f in t.get("fields", {}).items() if not f.get("deleted")}
    tables = {k: TABLE_RENAME.get(k, k) for k, v in live.items() if live_fields(v) or k == "user"}

    out = []
    fks, idx, joins, comments = [], [], [], []
    bmap = {"tables": {}, "joins": []}

    out.append("-- Knightingale app schema, generated from the Bubble export by scripts/gen_schema.py")
    out.append("-- Every table keeps bubble_id so data can be migrated and cross-referenced.\n")
    out.append("create schema if not exists app;\n")
    out.append(
        "create or replace function app.set_updated_at() returns trigger language plpgsql as $$\n"
        "begin new.updated_at = now(); return new; end $$;\n"
    )

    for tkey in sorted(tables, key=lambda k: (k != "user", k)):
        tname = tables[tkey]
        t = live[tkey]
        used = set(SYSTEM_COLS)
        cols = [
            "  id uuid primary key default gen_random_uuid()",
            "  bubble_id text unique",
            "  created_at timestamptz not null default now()",
            "  updated_at timestamptz not null default now()",
            "  created_by uuid",
        ]
        if tkey == "user":
            used |= {"auth_user_id", "email"}
            cols += [
                "  auth_user_id uuid unique references auth.users(id) on delete set null",
                "  email text unique",
            ]
        fmap = {}
        for fkey, f in sorted(live_fields(t).items()):
            v = f["value"]
            disp = f.get("display", fkey)
            is_list = v.startswith("list.")
            base = v[5:] if is_list else v
            if is_list and (base == "user" or base.startswith("custom.")):
                target = "user" if base == "user" else base[7:]
                if target not in tables:
                    continue
                jcol = snake(disp)
                jname = f"{tname}_{jcol}"[:63]
                ttarget = tables[target]
                joins.append(
                    f"create table app.{jname} (\n"
                    f"  {tname if tname != ttarget else 'owner'}_id uuid not null references app.{tname}(id) on delete cascade,\n"
                    f"  {ttarget}_id uuid not null references app.{ttarget}(id) on delete cascade,\n"
                    f"  primary key ({tname if tname != ttarget else 'owner'}_id, {ttarget}_id)\n);\n"
                    f"comment on table app.{jname} is {q(f'Bubble list field {tkey}.{fkey} ({disp})')};"
                )
                bmap["joins"].append({"bubble_type": tkey, "bubble_field": fkey, "table": jname,
                                      "owner_col": f"{tname if tname != ttarget else 'owner'}_id",
                                      "target_col": f"{ttarget}_id", "target_table": ttarget})
                continue
            name = col_name(disp, used)
            note = None
            if base == "user" or base.startswith("custom."):
                target = "user" if base == "user" else base[7:]
                if target not in tables:
                    continue
                pg = "uuid"
                fks.append((tname, name, tables[target]))
                note = f"-> {tables[target]}"
            elif base.startswith("option."):
                pg = "text"
                note = f"option set: {base[7:]}"
            else:
                pg = SCALAR.get(base, "text")
            if is_list:
                pg += "[]"
            default = "" if is_list else (lambda L: f" default {L}" if L else "")(lit(f.get("default_val"), pg))
            cols.append(f"  {name} {pg}{default}")
            fmap[fkey] = {"column": name, "type": v}
            c = f"Bubble {tkey}.{fkey}" + (f" ({note})" if note else "")
            comments.append(f"comment on column app.{tname}.{name} is {q(c)};")
        out.append(f"create table app.{tname} (\n" + ",\n".join(cols) + "\n);")
        out.append(f"comment on table app.{tname} is {q('Bubble type ' + tkey + ' (' + t.get('display', tkey) + ')')};")
        out.append(f"create trigger {tname}_updated_at before update on app.{tname} "
                   f"for each row execute function app.set_updated_at();\n")
        bmap["tables"][tkey] = {"table": tname, "fields": fmap}

    out.append("-- Foreign keys (added after all tables exist)")
    for tname in tables.values():
        out.append(f"alter table app.{tname} add constraint {tname}_created_by_fkey "
                   f"foreign key (created_by) references app.users(id) on delete set null;")
    for tname, col, target in fks:
        cname = f"{tname}_{col}_fkey"[:63]
        out.append(f"alter table app.{tname} add constraint {cname} foreign key ({col}) "
                   f"references app.{target}(id) on delete set null;")
        idx.append(f"create index on app.{tname} ({col});")
    out.append("")
    out.append("-- Join tables (Bubble list-of-thing fields)")
    out += joins
    out.append("")
    out.append("-- Indexes on foreign keys")
    out += idx
    out.append("")
    out.append("-- Lock everything down; access policies come in a later migration.")
    out.append("do $$ declare r record; begin\n"
               "  for r in select tablename from pg_tables where schemaname = 'app' loop\n"
               "    execute format('alter table app.%I enable row level security', r.tablename);\n"
               "  end loop;\nend $$;\n")
    out += comments

    MIG.mkdir(parents=True, exist_ok=True)
    (MIG / "20261114000000_app_schema.sql").write_text("\n".join(out) + "\n")

    # Option sets -> one lookup table
    o = [
        "-- Bubble option sets, generated by scripts/gen_schema.py",
        "create table app.option_values (\n"
        "  set_key text not null,\n  value text not null,\n  display text not null,\n"
        "  sort int,\n  attributes jsonb not null default '{}'::jsonb,\n"
        "  primary key (set_key, value)\n);",
        "alter table app.option_values enable row level security;",
        "",
    ]
    rows = []
    for skey, s in sorted(d["option_sets"].items()):
        if s.get("deleted"):
            continue
        for val in s.get("values", {}).values():
            if val.get("deleted"):
                continue
            attrs = {k: val[k] for k in s.get("attributes", {}) if k in val}
            rows.append(f"  ({q(skey)}, {q(str(val.get('db_value')))}, {q(str(val.get('display')))}, "
                        f"{int(val.get('sort_factor') or 0)}, {q(json.dumps(attrs))}::jsonb)")
    o.append("insert into app.option_values (set_key, value, display, sort, attributes) values\n"
             + ",\n".join(rows) + ";")
    (MIG / "20261114000001_option_values.sql").write_text("\n".join(o) + "\n")

    (ROOT / "supabase" / "bubble_map.json").write_text(json.dumps(bmap, indent=2) + "\n")
    print(f"tables={len(tables)} joins={len(joins)} fks={len(fks)} option_values={len(rows)}")


if __name__ == "__main__":
    main(sys.argv[1])
