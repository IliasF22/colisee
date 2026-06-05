"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X, Swords, Trophy, Map as MapIcon } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const items = [
  { href: "/duel", label: "L'Arène", icon: Swords },
  { href: "/classement", label: "Classement", icon: Trophy },
  { href: "/carte", label: "Carte", icon: MapIcon },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-bd bg-sf text-mt transition-colors hover:bg-sf-hover hover:text-fg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[60] sm:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-bd bg-bg p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-cinzel text-lg font-bold tracking-wider">Colisée</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="flex h-8 w-8 items-center justify-center rounded-md text-mt transition-colors hover:bg-sf-hover hover:text-fg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-mt transition-colors hover:bg-sf-hover hover:text-fg"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex items-center justify-between border-t border-bd pt-4">
              <span className="text-xs text-mt">Thème</span>
              <ThemeToggle />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
