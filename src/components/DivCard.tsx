"use client";

import { useLayoutEffect, useRef } from "react";
import type { Line } from "@/lib/api";
import { GameText } from "./GameText";

export interface DivCardProps {
  name: string;
  stackSize: number;
  art: string | null;
  reward: Line[];
  flavour: Line[];
  frame: string;
  /** Load the art eagerly (cards above the fold). */
  priority?: boolean;
}

/**
 * A divination card drawn as the game does: art behind the frame, the name on the
 * ribbon, the stack size in the left box, then reward and flavour text.
 *
 * Every size is relative to the card width (container query units), so the layout is
 * identical at any size. Text that does not fit is scaled down like in game.
 */
export function DivCard({ name, stackSize, art, reward, flavour, frame, priority }: DivCardProps) {
  const nameRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const name = nameRef.current;
    const text = textRef.current;
    if (!name || !text) return;
    const refit = () => {
      fit(name, "x");
      fit(text, "y");
    };
    refit();
    // Measure again once the web font is in, and when a hidden card gets a size.
    let cancelled = false;
    document.fonts?.ready.then(() => !cancelled && refit());
    const observer = new ResizeObserver(() => {
      if (!("fitted" in text.dataset)) refit();
    });
    observer.observe(text);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [name, reward, flavour]);

  return (
    <div className="divcard">
      {art && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="divcard-art"
          src={art}
          alt=""
          width={389}
          height={279}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="divcard-frame" src={frame} alt="" width={439} height={670} decoding="async" />
      <div className="divcard-name" ref={nameRef}>
        <span>{name}</span>
      </div>
      <div className="divcard-stack">{stackSize}</div>
      <div className="divcard-text" ref={textRef}>
        <div>
          {reward.length > 0 && <GameText lines={reward} className="divcard-reward" />}
          {reward.length > 0 && flavour.length > 0 && <hr className="divcard-separator" />}
          {flavour.length > 0 && <GameText lines={flavour} className="divcard-flavour" />}
        </div>
      </div>
    </div>
  );
}

/**
 * Shrinks the box's content (through the --fit variable) until it fits. Sizes are
 * proportional to the card width, so the factor holds at every card size.
 */
function fit(box: HTMLElement, axis: "x" | "y") {
  const content = box.firstElementChild as HTMLElement | null;
  if (!content || !box.clientWidth) return; // not laid out yet (hidden)
  let scale = 1;
  box.style.setProperty("--fit", "1");
  for (let i = 0; i < 4; i++) {
    const available = axis === "x" ? box.clientWidth : box.clientHeight;
    const needed = axis === "x" ? content.scrollWidth : content.scrollHeight;
    if (needed <= available + 0.5) break;
    scale *= (available / needed) * 0.99;
    box.style.setProperty("--fit", scale.toFixed(3));
  }
  box.dataset.fitted = "";
}
