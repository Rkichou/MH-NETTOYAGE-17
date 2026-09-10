"use client";
import { useEffect, useRef, useId } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { useSiteMotion } from "./motion-provider";

export function Modal({ title, children, onClose, className = "" }: { title: string; children: React.ReactNode; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { enabled } = useSiteMotion();
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal(); document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className={`native-modal ${className}`} aria-labelledby={titleId} onKeyDown={(e) => {
    if (e.key !== "Tab") return;
    const nodes = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex="0"]'));
    const first = nodes[0]; const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }} onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <motion.div className="modal-panel" initial={enabled ? { opacity: 0, y: 18 } : false} animate={{ opacity: 1, y: 0 }}>
      <button autoFocus className="dialog-close" type="button" onClick={onClose} aria-label="Fermer"><X /></button>
      <h2 id={titleId}>{title}</h2>{children}
    </motion.div>
  </dialog>;
}
