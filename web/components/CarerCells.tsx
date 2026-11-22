import { fileHref } from "@/lib/files";

const ROLE_LABEL: Record<string, string> = { rn: "RN", en: "EN", dsw: "DSW", pca: "PCA", student_nurse: "Student nurse", cleaner: "Cleaner" };
export const roleList = (roles: string[] | null) => (roles ?? []).map((r) => ROLE_LABEL[r] ?? r).join(", ");
export const hoursLabel = (h: number) => `${Number(h).toLocaleString("en-AU", { maximumFractionDigits: 1 })} h`;

/** Round portrait, or the first initial when there is no photo. */
export function Portrait({ photo, name, generic = false }: { photo: string | null; name: string; generic?: boolean }) {
  if (photo) return <img className="portrait" src={fileHref(photo)} alt="" loading="lazy" />;
  if (generic) {
    // Generic profile silhouette for people with no photo.
    return (
      <span className="portrait blank" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="60%" height="60%" fill="currentColor">
          <circle cx="12" cy="8" r="4.2" />
          <path d="M3.5 21c0-4.4 3.8-7.5 8.5-7.5s8.5 3.1 8.5 7.5z" />
        </svg>
      </span>
    );
  }
  return <span className="portrait blank">{name.trim()[0] ?? "?"}</span>;
}
