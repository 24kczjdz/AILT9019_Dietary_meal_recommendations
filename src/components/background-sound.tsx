"use client";

import { useEffect, useRef, useState } from "react";
import { withBase } from "@/lib/base";

const KEY = "mise.sound";

export function BackgroundSound() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;
    if (window.localStorage.getItem(KEY) !== "on") return;
    audio.play().then(() => setOn(true)).catch(() => setOn(false));
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (on) {
      audio.pause();
      window.localStorage.setItem(KEY, "off");
      setOn(false);
      return;
    }
    audio.volume = 0.35;
    audio
      .play()
      .then(() => {
        window.localStorage.setItem(KEY, "on");
        setOn(true);
      })
      .catch(() => setOn(false));
  }

  return (
    <>
      <audio ref={audioRef} src={withBase("/audio/background.mp3")} loop preload="none" />
      <button
        type="button"
        className="no-print fixed right-4 bottom-4 z-40 rounded-full border bg-card px-4 py-2 text-sm shadow-sm"
        aria-pressed={on}
        onClick={toggle}
      >
        {on ? "Sound on" : "Sound off"}
      </button>
    </>
  );
}
