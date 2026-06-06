"use client";

import { useEffect } from "react";

/**
 * Affiche une onde dorée au point de clic sur tout élément interactif
 * (bouton, lien, pill de catégorie, carte de duel, ligne de classement).
 */
export function ClickRipple() {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const interactive = el.closest(
        'button, a, [role="button"], .category-pill, .duel-card, .lb-row'
      );
      if (!interactive) return;

      const ripple = document.createElement("span");
      ripple.className = "global-ripple";
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 650);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return null;
}
