"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { watchedAction } from "./actions";

type Video = { key: string; title: string; yt: string; seconds: number; img: string };

export function CultureList({ videos, done: initial, viewAs }: { videos: Video[]; done: Record<string, boolean>; viewAs: boolean }) {
  const [done, setDone] = useState(initial);
  const [open, setOpen] = useState<Video | null>(null);
  const [left, setLeft] = useState(0);
  const [, start] = useTransition();
  const cards = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!open) return;
    setLeft(open.seconds);
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (!open || left > 0) return;
    const v = open;
    setOpen(null);
    setDone((d) => ({ ...d, [v.key]: true }));
    if (!viewAs) start(() => { void watchedAction(v.key); });
    const next = videos[videos.findIndex((x) => x.key === v.key) + 1];
    if (next) setTimeout(() => cards.current[next.key]?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
  }, [left, open, videos, viewAs]);

  const watched = videos.filter((v) => done[v.key]).length;

  return (
    <>
      <p className="culture-count">{watched} of {videos.length} watched</p>
      <div className="culture-list">
        {videos.map((v) => (
          <article key={v.key} className="culture-card" ref={(el) => { cards.current[v.key] = el; }}>
            {done[v.key] && <span className="culture-medal" title="Watched">🎖️</span>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.img} alt="" loading="lazy" />
            <h2>{v.title}</h2>
            <button type="button" className="culture-watch" onClick={() => setOpen(v)}>Watch</button>
          </article>
        ))}
      </div>

      {open && (
        <div className="culture-pop" role="dialog" aria-modal="true" aria-label={open.title}>
          <div className="culture-pop-in">
            <h2>{open.title}</h2>
            <div className="culture-frame">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${open.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={open.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
            <div className="culture-bar"><span style={{ width: `${100 - (left / open.seconds) * 100}%` }} /></div>
            <p className="hint">{viewAs ? "Viewing as this carer: this won't be recorded." : "Your medal appears when the video finishes."}</p>
            <button type="button" className="link" onClick={() => setOpen(null)}>Leave without finishing</button>
          </div>
        </div>
      )}
    </>
  );
}
