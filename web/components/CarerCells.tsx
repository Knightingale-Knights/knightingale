import { fileHref } from "@/lib/files";

const ROLE_LABEL: Record<string, string> = { rn: "RN", en: "EN", dsw: "DSW", pca: "PCA", student_nurse: "Student nurse", cleaner: "Cleaner" };
export const roleList = (roles: string[] | null) => (roles ?? []).map((r) => ROLE_LABEL[r] ?? r).join(", ");
export const hoursLabel = (h: number) => `${Number(h).toLocaleString("en-AU", { maximumFractionDigits: 1 })} h`;

/** Round portrait, or the first initial when there is no photo. */
export function Portrait({ photo, name }: { photo: string | null; name: string }) {
  return photo
    ? <img className="portrait" src={fileHref(photo)} alt="" loading="lazy" />
    : <span className="portrait blank">{name.trim()[0] ?? "?"}</span>;
}
