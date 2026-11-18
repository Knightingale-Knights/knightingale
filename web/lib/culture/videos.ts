// Culture of Care: the 13 short videos carers watch, in order, as on Bubble's Culture of Care page.
// `key` is the column in app.care_culture_checklists that turns on the medal; `seconds` is how long
// the video stays open before it counts as watched (Bubble's timings).
const IMG = "https://460c4cc3302d6c3d3eb89b668d0e0508.cdn.bubble.io";

export const CULTURE_VIDEOS = [
  { key: "one", title: "Video #1", yt: "m6UFfnPc63g", seconds: 30, img: `${IMG}/f1790393395117x814322007067456200/Screenshot%202026-09-26%20at%201.29.34%E2%80%AFpm.png` },
  { key: "intro", title: "Introduction", yt: "X6jl-HJfcyY", seconds: 32, img: `${IMG}/f1790417647185x658349883005522000/Screenshot%202026-09-26%20at%208.13.06%E2%80%AFpm.png` },
  { key: "vision", title: "Vision | Mission", yt: "WWtuSRpLkZo", seconds: 93, img: `${IMG}/f1790448084919x671855294895382400/3.%20Screenshot%202026-09-27%20at%204.39.53%E2%80%AFam.png` },
  { key: "philosophy", title: "The Philosophy", yt: "RU8sYqXsqXc", seconds: 99, img: `${IMG}/f1790448716701x552425645594959700/4.%20Screenshot%202026-09-27%20at%204.45.12%E2%80%AFam.png` },
  { key: "trust", title: "Trust is Foundational", yt: "xjJvu0YKuis", seconds: 198, img: `${IMG}/f1790449001663x261658855704701470/5.%20Screenshot%202026-09-27%20at%204.55.16%E2%80%AFam.png` },
  { key: "listen", title: "Listen | Engage", yt: "XT29uA9m9to", seconds: 157, img: `${IMG}/f1790449401390x956455572160892700/6.%20Screenshot%202026-09-27%20at%205.00.54%E2%80%AFam.png` },
  { key: "proactive", title: "Proactive Selflessness", yt: "ulvGuvRce9g", seconds: 157, img: `${IMG}/f1790449745116x730978125389544700/7.%20Screenshot%202026-09-27%20at%205.06.50%E2%80%AFam.png` },
  { key: "compassion", title: "Compassion of Possibility", yt: "f8vENX0bgQ0", seconds: 102, img: `${IMG}/f1790450128439x333940650375177400/8.%20Screenshot%202026-09-27%20at%205.14.05%E2%80%AFam.png` },
  { key: "to_do_list", title: "Forget the To-Do List", yt: "vi1A9OZJLIU", seconds: 190, img: `${IMG}/f1790451092809x857992363631421600/9.%20Screenshot%202026-09-27%20at%205.30.55%E2%80%AFam.png` },
  { key: "lifer", title: "Be A Lifer", yt: "joi2jv8pCuY", seconds: 183, img: `${IMG}/f1790451455701x229220265981845860/10.%20Screenshot%202026-09-27%20at%205.36.44%E2%80%AFam.png` },
  { key: "refusals", title: "Manage Refusals", yt: "iQb877Q8C-0", seconds: 182, img: `${IMG}/f1790451782635x774806444232834600/11.%20Screenshot%202026-09-27%20at%205.41.53%E2%80%AFam.png` },
  { key: "hospitality", title: "Unreasonable Hospitality", yt: "Sg1gOtUFI_Q", seconds: 336, img: `${IMG}/f1790452126206x758079635202401000/12.%20Screenshot%202026-09-27%20at%205.48.10%E2%80%AFam.png` },
  { key: "future", title: "The Future", yt: "gj5fPZABxCg", seconds: 126, img: `${IMG}/f1790551339677x941679088116734500/13.%20Screenshot%202026-09-28%20at%209.18.13%E2%80%AFam.png` },
] as const;

export type CultureKey = (typeof CULTURE_VIDEOS)[number]["key"];
export const CULTURE_KEYS = CULTURE_VIDEOS.map((v) => v.key) as CultureKey[];
export const isCultureKey = (k: string): k is CultureKey => (CULTURE_KEYS as string[]).includes(k);

/** Thumbnails are served from our own storage once copied (falls back to Bubble's CDN). */
export const cultureImg = (url: string) => `/site-img?u=${encodeURIComponent(url)}`;
