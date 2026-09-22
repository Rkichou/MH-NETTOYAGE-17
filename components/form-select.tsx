"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

type Props = { name: string; label: string; value: string; options: string[]; onChange: (value: string) => void; error?: string };

export function FormSelect({ name, label, value, options, onChange, error }: Props) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef({ text: "", time: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const show = () => { setActive(Math.max(0, options.indexOf(value))); setOpen(true); };
  const choose = (index: number) => { onChange(options[index]); setOpen(false); trigger.current?.focus({ preventScroll: true }); };

  useLayoutEffect(() => {
    if (!open) return;
    // A body portal avoids clipping by the animated form step and its transforms.
    const position = () => {
      if (!trigger.current || !list.current) return;
      const rect = trigger.current.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) { setOpen(false); return; }
      const below = window.innerHeight - rect.bottom - 16;
      const above = rect.top - 16;
      const upwards = below < Math.min(300, options.length * 48 + 12) && above > below;
      Object.assign(list.current.style, {
        width: `${Math.min(rect.width, window.innerWidth - 24)}px`,
        left: `${Math.max(12, Math.min(rect.left, window.innerWidth - rect.width - 12))}px`,
        top: upwards ? "auto" : `${rect.bottom + 8}px`,
        bottom: upwards ? `${window.innerHeight - rect.top + 8}px` : "auto",
        maxHeight: `${Math.max(48, Math.min(320, upwards ? above : below))}px`,
        visibility: "visible",
      });
    };
    position();
    const outside = (event: PointerEvent) => {
      if (!trigger.current?.contains(event.target as Node) && !list.current?.contains(event.target as Node)) setOpen(false);
    };
    const blur = (event: FocusEvent) => { if (!trigger.current?.contains(event.target as Node)) setOpen(false); };
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", blur);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", blur);
    };
  }, [open, options.length]);

  useEffect(() => {
    const panel = list.current;
    const option = panel?.children[active] as HTMLElement | undefined;
    if (!open || !panel || !option) return;
    if (option.offsetTop < panel.scrollTop) panel.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > panel.scrollTop + panel.clientHeight) panel.scrollTop = option.offsetTop + option.offsetHeight - panel.clientHeight;
  }, [active, open]);

  return <div className="form-select-field">
    <label id={`${id}-label`} htmlFor={id}>{label}</label>
    <button ref={trigger} id={id} name={name} type="button" role="combobox" className="form-select-trigger" data-placeholder={!value}
      aria-labelledby={`${id}-label`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined}
      aria-activedescendant={open ? `${id}-option-${active}` : undefined} aria-required="true" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
      onClick={() => open ? setOpen(false) : show()}
      onKeyDown={event => {
        const key = event.key;
        if (key === "Tab") { setOpen(false); return; }
        if (key === "Escape") { if (open) { event.preventDefault(); event.stopPropagation(); setOpen(false); } return; }
        if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(key)) {
          event.preventDefault();
          if (!open) { show(); if (key === "End") setActive(options.length - 1); return; }
          if (key === "Enter" || key === " ") choose(active);
          else setActive(index => key === "Home" ? 0 : key === "End" ? options.length - 1 : Math.max(0, Math.min(options.length - 1, index + (key === "ArrowDown" ? 1 : -1))));
        } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          const now = Date.now();
          const text = (now - search.current.time > 700 ? "" : search.current.text) + key.toLocaleLowerCase("fr");
          search.current = { text, time: now };
          const match = options.findIndex(option => option.toLocaleLowerCase("fr").startsWith(text));
          if (!open) show();
          if (match >= 0) setActive(match);
        }
      }}><span>{value || "Sélectionner"}</span><ChevronDown size={18} aria-hidden="true" /></button>
    <input type="hidden" name={name} value={value} />
    {error && <small className="field-error" id={`${id}-error`}>{error}</small>}
    {open && createPortal(<div ref={list} id={`${id}-list`} className="form-select-list" role="listbox" aria-labelledby={`${id}-label`} data-lenis-prevent style={{ visibility: "hidden" }}>
      {options.map((option, index) => <div key={option} id={`${id}-option-${index}`} role="option" aria-selected={value === option} data-active={active === index}
        onPointerMove={() => setActive(index)} onPointerDown={event => event.preventDefault()} onClick={() => choose(index)}>
        <span>{option}</span>{value === option && <Check size={17} aria-hidden="true" />}
      </div>)}
    </div>, document.body)}
  </div>;
}
