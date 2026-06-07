"use client";

import { useState, useMemo } from "react";
import { MapPin, ChevronDown, Loader2, Navigation, X, Search } from "lucide-react";
import { useLocationContext } from "@/lib/LocationContext";

export function HeaderLocation() {
  const { label, locating, cities, requestLocation, setCity, clearLocation } = useLocationContext();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    const list = n ? cities.filter((c) => c.toLowerCase().includes(n)) : cities;
    return list.slice(0, 80);
  }, [q, cities]);

  const pick = (c: string) => { setCity(c); setOpen(false); setQ(""); };
  const gps = () => { requestLocation(); setOpen(false); };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors ${
          label ? "border-gld/40 bg-gld/10 text-gld" : "border-bd text-mt hover:bg-sf-hover hover:text-fg"
        }`}
      >
        {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate max-w-[110px] sm:max-w-[180px]">{label || "Ma ville"}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-bd bg-bg p-2 shadow-xl">
            <button
              onClick={gps}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium text-fg transition-colors hover:bg-sf-hover"
            >
              <Navigation className="h-3.5 w-3.5 text-gld" /> Utiliser ma position
            </button>

            <div className="relative my-1.5">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mt" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher une ville…"
                className="w-full rounded-md border border-bd bg-sf py-1.5 pl-8 pr-2 text-[16px] text-fg outline-none transition-colors focus:border-mt placeholder:text-mt/50"
              />
            </div>

            <div className="max-h-56 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-2.5 py-2 text-[12px] text-mt">Aucune ville trouvée</p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c}
                    onClick={() => pick(c)}
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-sf-hover hover:text-fg ${
                      c === label ? "text-gld" : "text-mt"
                    }`}
                  >
                    <MapPin className="h-3 w-3 shrink-0 opacity-50" />
                    <span className="truncate">{c}</span>
                  </button>
                ))
              )}
            </div>

            {label && (
              <button
                onClick={() => { clearLocation(); setOpen(false); }}
                className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-bd-subtle px-2.5 pt-2 pb-1 text-[12px] text-mt transition-colors hover:text-fg"
              >
                <X className="h-3 w-3" /> Toute la France
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
