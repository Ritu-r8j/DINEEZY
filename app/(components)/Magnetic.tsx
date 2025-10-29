"use client";
import React, { useRef } from 'react';

type Props = {
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  strength?: number; // pixels of max translation
};

export function Magnetic({ children, strength = 12 }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tx = Math.max(Math.min(x / (rect.width / 2) * strength, strength), -strength);
    const ty = Math.max(Math.min(y / (rect.height / 2) * strength, strength), -strength);
    el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
  }

  function onLeave() {
    const el = ref.current as HTMLElement | null;
    if (!el) return;
    el.style.transform = 'translate3d(0,0,0)';
  }

  return (
    // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
    <span onMouseMove={onMove} onMouseLeave={onLeave} className="inline-block">
      {(
        (React.cloneElement as any)(children, { ref })
      )}
    </span>
  );
}
