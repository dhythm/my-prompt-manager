"use client";

import { useEffect, useId, useRef, useState } from "react";

export function SidebarSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <div className="relative" ref={rootRef}>
        <button
          className="flex w-full items-center justify-between gap-2 rounded-md border border-white/[0.08] bg-[#10141c] px-2.5 py-2 text-left text-[13px] leading-tight text-zinc-100 outline-none hover:border-white/20 focus-visible:border-[var(--accent)]"
          type="button"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="min-w-0 truncate">{selected?.label ?? ""}</span>
          <svg
            className={`h-3 w-3 shrink-0 text-zinc-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 12 12"
            aria-hidden="true"
          >
            <path
              d="M2.4 4.2 6 8l3.6-3.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open ? (
          <div
            className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-white/10 bg-[#0c1016] py-1 shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
            id={listId}
            role="listbox"
          >
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  className={`flex w-full px-2.5 py-1.5 text-left text-[13px] leading-tight ${
                    active
                      ? "bg-white/[0.08] text-white"
                      : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
                  }`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
