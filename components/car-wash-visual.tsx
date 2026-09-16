"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSiteMotion } from "./motion-provider";
import type { CarWashScene } from "@/lib/car-wash-scene";

export function CarWashVisual() {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<CarWashScene | null>(null);
  const { enabled } = useSiteMotion();
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const motion = useRef({ enabled: false, clean: true });

  useEffect(() => {
    motion.current = { enabled: enabled && !paused, clean: !enabled };
    scene.current?.setMotion(enabled && !paused, !enabled);
  }, [enabled, paused]);

  useEffect(() => {
    const controller = new AbortController();
    const element = host.current!;
    let disposed = false;
    import("@/lib/car-wash-scene").then(async ({ createCarWashScene }) => {
      if (disposed) return;
      const instance = await createCarWashScene(element, controller.signal, () => {
        if (!disposed) { setFailed(true); setReady(false); }
      });
      if (disposed) { instance.dispose(); return; }
      scene.current = instance;
      instance.setMotion(motion.current.enabled, motion.current.clean);
      setReady(true);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; controller.abort(); scene.current?.dispose(); scene.current = null; };
  }, []);

  return <div className="car-wash-visual" data-ready={ready && !failed} data-state={failed ? "fallback" : ready ? "ready" : "loading"}>
    <div className="car-wash-fallback" aria-hidden={ready && !failed}>
      <Image src="/images/volkswagen-golf-apres-lavage-vue-trois-quarts.jpeg" alt="Volkswagen Golf après un lavage en atelier" fill priority sizes="(max-width: 800px) 100vw, 60vw" />
    </div>
    <div ref={host} className="car-wash-canvas" role="img" aria-hidden={!ready || failed} aria-label="Voiture graphite en trois-quarts sur un socle, lavée à la mousse puis rincée par une lance à eau." />
    {ready && !failed && enabled && <button className="scene-pause" type="button" aria-label={paused ? "Reprendre l’animation" : "Mettre l’animation en pause"} title={paused ? "Reprendre l’animation" : "Mettre en pause"} onClick={() => setPaused((value) => !value)}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>}
  </div>;
}
