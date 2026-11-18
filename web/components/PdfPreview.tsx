"use client";
import { useEffect, useRef, useState } from "react";

/** Shows the first page of a PDF as a picture, so carers see their certificate without opening it. */
export function PdfPreview({ src, alt }: { src: string; alt: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const data = await (await fetch(src, { credentials: "same-origin" })).arrayBuffer();
        const doc = await pdfjs.getDocument({ data }).promise;
        const page = await doc.getPage(1);
        const c = canvas.current;
        if (cancelled || !c) return;
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(2, 900 / base.width);
        const vp = page.getViewport({ scale });
        c.width = vp.width;
        c.height = vp.height;
        await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [src]);

  if (failed) return <a className="button" href={src} target="_blank" rel="noreferrer">View PDF</a>;
  return (
    <a href={src} target="_blank" rel="noreferrer" aria-label={alt}>
      <canvas ref={canvas} className="pdf-preview" />
    </a>
  );
}
