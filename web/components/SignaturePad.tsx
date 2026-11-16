"use client";
import { useEffect, useRef, useState } from "react";

/** Finger or mouse signature. Posts a PNG data URL as `name`; Clear posts `${name}__clear`. */
export function SignaturePad({ name, current }: { name: string; current?: string | null }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState("");
  const [cleared, setCleared] = useState(false);
  const drawing = useRef(false);

  useEffect(() => {
    const c = canvas.current!;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1917";
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  const down = (e: React.PointerEvent) => {
    drawing.current = true;
    canvas.current!.setPointerCapture(e.pointerId);
    const ctx = canvas.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(...pos(e));
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvas.current!.getContext("2d")!;
    ctx.lineTo(...pos(e));
    ctx.stroke();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setData(canvas.current!.toDataURL("image/png"));
    setCleared(false);
  };
  const clear = () => {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setData("");
    setCleared(true);
  };

  return (
    <div className="sigpad">
      {current && !data && !cleared && <img src={current} alt="Saved signature" className="sig-saved" />}
      <canvas ref={canvas} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
      <input type="hidden" name={name} value={data} />
      {cleared && <input type="hidden" name={`${name}__clear`} value="1" />}
      <div className="sig-actions">
        <span>{data ? "New signature" : current && !cleared ? "Saved signature shown. Sign below to replace it." : "Sign above"}</span>
        <button type="button" className="link" onClick={clear}>Clear</button>
      </div>
    </div>
  );
}
