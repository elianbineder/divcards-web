"use client";

import { useId, useMemo, useRef, useState } from "react";
import { formatWeight } from "@/lib/cards";

export interface PickerCard {
  slug: string;
  name: string;
  art: string | null;
  weight: number;
}

/** Search box that picks one card by name. */
export function CardPicker({
  cards,
  value,
  onChange,
  label,
}: {
  cards: PickerCard[];
  value: PickerCard | null;
  onChange: (card: PickerCard) => void;
  label: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? cards.filter((c) => c.name.toLowerCase().includes(q)) : cards;
    return list.slice(0, 12);
  }, [cards, query]);

  const pick = (card: PickerCard) => {
    onChange(card);
    setQuery("");
    setOpen(false);
    input.current?.blur();
  };

  return (
    <div className="relative">
      <input
        ref={input}
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
        value={query}
        placeholder={value ? value.name : "Search a card…"}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && open && matches[active]) {
            e.preventDefault();
            pick(matches[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={`h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-accent ${
          value ? "placeholder:font-game placeholder:text-base placeholder:text-foreground" : "placeholder:text-muted/70"
        }`}
      />
      {open && matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-80 w-full overflow-auto rounded-md border border-border bg-surface-2 py-1 shadow-xl"
        >
          {matches.map((c, i) => (
            <li
              key={c.slug}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(c);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-1.5 ${i === active ? "bg-background" : ""}`}
            >
              {c.art && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.art} alt="" width={42} height={30} className="h-[30px] w-[42px] rounded-sm object-cover" />
              )}
              <span className="font-game text-base">{c.name}</span>
              <span className="ml-auto text-xs tabular-nums text-muted">{formatWeight(c.weight)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

