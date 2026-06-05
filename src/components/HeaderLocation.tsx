"use client";

import { MapPin, Loader2 } from "lucide-react";
import { useLocationContext } from "@/lib/LocationContext";

export function HeaderLocation() {
  const { zone, locating, requestLocation } = useLocationContext();

  if (zone) {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-bd bg-sf px-2.5 py-1 text-[12px]">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-fg" />
        <span className="font-medium text-fg truncate max-w-[120px] sm:max-w-[180px]">{zone.label}</span>
      </div>
    );
  }

  if (locating) {
    return (
      <div className="flex items-center gap-1.5 px-1 text-[12px] text-mt">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="hidden sm:inline">Localisation…</span>
      </div>
    );
  }

  return (
    <button
      onClick={requestLocation}
      className="flex items-center gap-1.5 rounded-md border border-bd px-2.5 py-1 text-[12px] text-mt transition-colors hover:bg-sf-hover hover:text-fg"
    >
      <MapPin className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden sm:inline">Me localiser</span>
    </button>
  );
}
