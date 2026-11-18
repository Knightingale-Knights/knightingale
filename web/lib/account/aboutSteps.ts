// The About You questions (no database code, so the browser form can use them).
export const ABOUT_FIELDS = [
  "why_care", "education", "skills", "hobbies", "animal", "pets", "tv_film", "film", "music", "musical_genre", "team", "sport",
] as const;
export type AboutKey = (typeof ABOUT_FIELDS)[number];
export type About = Record<AboutKey, string>;

/** The steps after the intro, as in Bubble. */
export const ABOUT_STEPS: { title: string; fields: { key: AboutKey; label: string; rows: number }[] }[] = [
  { title: "Why do you care?", fields: [{ key: "why_care", label: "", rows: 9 }] },
  { title: "Education / Skills", fields: [{ key: "education", label: "List your education courses:", rows: 4 }, { key: "skills", label: "List all your skills:", rows: 4 }] },
  { title: "Hobbies", fields: [{ key: "hobbies", label: "Do you have any hobbies outside work?", rows: 4 }] },
  { title: "Animals", fields: [{ key: "animal", label: "Your fave animal, why?", rows: 4 }, { key: "pets", label: "Tell us about any pets you've had.", rows: 4 }] },
  { title: "TV & Film", fields: [{ key: "tv_film", label: "Your fave TV show, why?", rows: 4 }, { key: "film", label: "Your fave movie, why?", rows: 4 }] },
  { title: "Music", fields: [{ key: "music", label: "Your fave band, why?", rows: 4 }, { key: "musical_genre", label: "Your fave musical genre, why?", rows: 4 }] },
  { title: "Sport", fields: [{ key: "team", label: "Your fave sports? Which team?", rows: 4 }, { key: "sport", label: "What sport do you play?", rows: 4 }] },
];

