// The public website: path -> content. Paths match the Bubble site so existing links and search results keep working.
import type { Page } from "./types";
import index from "./content/index";
import about from "./content/about_us";
import contact from "./content/contact_us";
import careOrgs from "./content/care_organisations";
import hcp from "./content/healthcare_professionals";
import ndis from "./content/ndis";
import vmch from "./content/vmch";
import privacy from "./content/privacy";
import terms from "./content/terms";

export const SITE_PAGES: Record<string, Page> = {
  about_us: about,
  contact_us: contact,
  care_organisations: careOrgs,
  healthcare_professionals: hcp,
  ndis,
  vmch,
  privacy,
  terms,
};
export const HOME = index;
export const SITE_URL = "https://knightingale.com.au";
