"use client";
import { useState } from "react";
import { noteAction } from "./actions";
import { PendingButton } from "@/components/PendingButton";

const SUMMARY_EG = `- 0900: Arrived at John's home to find him sitting on the couch watching the morning news on tv. Spent the first two hours of the shift talking to John about how his week has been, personal information and our plan for the day

- 1130: Made John lunch. He ate left over dinner which I heated in the microwave. It was broccoli, mash and 3 sausages. He ate half the plate. He had 3 glasses of coke and some ice cream.

- 1200: I washed up from lunch and cleaned the kitchen. I made the bed and tidied the bedroom. I then vacuumed the living room, bedroom and kitchen. At the time, John was sitting on the couch watching Sopranos. This is his favourite show, he watches it everyday at 1200.

- 1300: I offered to shower John but he initially refused. When I reminded him we would go out for his GP appt, he agreed to take a shower. John takes some persuading to encourage him to shower.

- 1400: John had an appointment with his GP. I accompanied John into the room where they discussed John's blood results and how it might relate to his fatigue. When we left, John said Dr's don't know what they're talking about.

- 1500: We arrived home from the Dr's and John and I played a game of backgammon. He's been teaching me. It is his favourite thing to do in the afternoon with a cigarette and coffee. I made him a coffee, black with two sugars.

- 1600: My shift concluded. Before I left I made sure the back door was closed, the lights were off and that John was comfortable on the couch.`;

const COMMS_EG = `- Picked up a slip for a blood test from his regular GP, they need to attend on dd/mm.
- Participants next doctors appointment is on dd/mm at hh:mm.
- The doctor suggested participant visit chemist to purchase medication. I was given the prescription and I left it on the dining table for the next shift as participant didn't want to go today.`;

const BEST_EG = `- We shared a good laugh over politics
- I assisted her into her favourite chair and made a perfect cup of coffee
- We listened to his favourite song and he sang along which made he reminisce about the good old days.`;

/** The progress note in three steps: summary, communication book, best day. Saved only on Submit. */
export function NoteSteps({ shiftId, error }: { shiftId: string; error?: string }) {
  const [step, setStep] = useState(0);
  const [summary, setSummary] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const next = () => {
    if (step === 0 && summary.trim().length < 20) return setMsg("Please write a little more about the shift.");
    setMsg(null);
    setStep(step + 1);
  };

  return (
    <form action={noteAction} className="note-steps">
      <input type="hidden" name="id" value={shiftId} />
      {error && <p className="banner error">{error}</p>}

      <fieldset hidden={step !== 0}>
        <h3>Summary</h3>
        <p>Please enter any additional notes you took during the shift. For example:</p>
        <p className="eg">{SUMMARY_EG}</p>
        <textarea name="summary" rows={10} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder={SUMMARY_EG} maxLength={8000} />
        {msg && <p className="banner error">{msg}</p>}
        <button type="button" className="big" onClick={next}>Next</button>
      </fieldset>

      <fieldset hidden={step !== 1}>
        <h3>Communication book</h3>
        <p>Is there anything Paul or the next carer need to know? Please input it below. If not, &quot;<strong>Nothing to report.</strong>&quot;:</p>
        <p className="eg">{COMMS_EG}</p>
        <textarea name="comms" rows={7} placeholder={COMMS_EG} maxLength={4000} />
        <button type="button" className="big" onClick={next}>Next</button>
        <button type="button" className="link" onClick={() => setStep(0)}>← Back</button>
      </fieldset>

      <fieldset hidden={step !== 2}>
        <h3>Best day</h3>
        <p>Please jot down a small kindness you did for the participant. How did you make their day the best it could be? For example:</p>
        <p className="eg">{BEST_EG}</p>
        <textarea name="best_day" rows={5} placeholder={BEST_EG} maxLength={4000} required={step === 2} />
        <PendingButton className="big" pending="Submitting…">Submit</PendingButton>
        <button type="button" className="link" onClick={() => setStep(1)}>← Back</button>
      </fieldset>
    </form>
  );
}
