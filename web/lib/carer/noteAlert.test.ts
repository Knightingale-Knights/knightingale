import { describe, expect, it } from "vitest";
import { alertEmail, noteText, summaryBlock, templateModel } from "./noteAlert";
import { notePdf } from "@/lib/pdf";

describe("progress note alert", () => {
  it("sends the summary, plus the communication book when it has something in it", () => {
    expect(noteText({ summary: " Did things. ", comms: "Nothing to report." })).toBe("Did things.");
    expect(noteText({ summary: "Did things.", comms: "GP appt Monday 10am" })).toBe("Did things.\n\nCommunication book: GP appt Monday 10am");
  });
  it("matches Bubble's alert subject and body", () => {
    const m = alertEmail({ participant: "Lucia Romeo", carer: "Ilyas", date: "19/11/2026", summary: "Delivered meds." }, ["Lucia said she was unhappy."]);
    expect(m.subject).toBe("🚨🚨 IMPORTANT: LUCIA ROMEO PROGRESS NOTE 🚨🚨");
    expect(m.text).toContain("WHY THE ALERT WAS SENT:\n- Lucia said she was unhappy.");
    expect(m.text).toContain("CARER'S WORDS:\nDelivered meds.");
  });
  it("builds the note PDF", async () => {
    const b64 = await notePdf({ participant: "Lucia Romeo", carer: "Ilyas", date: "19/11/2026", summary: "Delivered meds.", comms: "Nothing to report.", bestDay: "We laughed.", reasons: ["One"] });
    expect(Buffer.from(b64, "base64").subarray(0, 4).toString()).toBe("%PDF");
  });
  it("puts each reason and paragraph on its own line in the template", () => {
    expect(summaryBlock("First para.\n\nSecond <para>.", ["One", "Two"], true))
      .toBe("WHY THE ALERT WAS SENT:<br>- One<br>- Two<br><br>CARER'S WORDS:<br>First para.<br><br>Second &lt;para&gt;.");
    const m = templateModel(["summary", "participant"], { participant: "A B", carer: "C", date: "1/1/2026", summary: "x" }, ["r"], { subject: "s", text: "t" }, ["summary"]);
    expect(m.summary).toBe("WHY THE ALERT WAS SENT:<br>- r<br><br>CARER'S WORDS:<br>x");
    expect(m.participant).toBe("A B");
  });
});
