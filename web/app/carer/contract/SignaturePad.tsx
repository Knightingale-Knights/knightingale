"use client";
import { useEffect, useRef, useState } from "react";

/** Draw-to-sign box. Puts a PNG data URL in a hidden "signature" field. */
export function SignaturePad({ disabled, label = "I agree and sign" }: { disabled?: boolean; label?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [data, setData] = useState("");

  useEffect(() => {
    const c = canvas.current!;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1917";
  }, []);

  const point = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  const down = (e: React.PointerEvent) => {
    if (disabled) return;
    canvas.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvas.current!.getContext("2d")!;
    const [x, y] = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvas.current!.getContext("2d")!;
    const [x, y] = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setData(canvas.current!.toDataURL("image/png"));
  };
  const clear = () => {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setData("");
  };

  return (
    <div className="sig">
      <canvas ref={canvas} className="sig-box" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-label="Sign here" />
      <input type="hidden" name="signature" value={data} />
      <div className="sig-row">
        <span className="hint">Sign above with your finger or mouse.</span>
        <button type="button" className="link" onClick={clear}>Clear</button>
      </div>
      <button className="big" disabled={disabled || !data}>{label}</button>
    </div>
  );
}
