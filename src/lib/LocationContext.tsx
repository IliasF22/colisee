"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { useFastFoods } from "./hooks";
import { getUserZone, cityFromAddress, Zone } from "./zones";
import { UserLocation } from "./geo";

const CITY_KEY = "colisee_city";

interface LocationContextValue {
  userLocation: UserLocation | null;
  zone: Zone | null;
  label: string | null;
  locating: boolean;
  source: "gps" | "city" | null;
  cities: string[];
  requestLocation: () => void;
  setCity: (city: string) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { fastfoods } = useFastFoods();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [manualCity, setManualCity] = useState<string | null>(null);
  const [source, setSource] = useState<"gps" | "city" | null>(null);
  const [locating, setLocating] = useState(false);

  // Liste des villes disponibles (depuis les restos chargés).
  const cities = useMemo(() => {
    const set = new Set<string>();
    fastfoods.forEach((ff) => {
      if (ff.location?.address) {
        const c = cityFromAddress(ff.location.address);
        if (c) set.add(c);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [fastfoods]);

  // Choisir une ville → on positionne l'utilisateur au centre des restos de cette ville.
  const setCity = useCallback((city: string) => {
    const inCity = fastfoods.filter(
      (ff) => ff.location?.address && cityFromAddress(ff.location.address) === city
    );
    if (!inCity.length) return;
    const lat = inCity.reduce((s, ff) => s + ff.location.latitude, 0) / inCity.length;
    const lng = inCity.reduce((s, ff) => s + ff.location.longitude, 0) / inCity.length;
    setUserLocation({ lat, lng });
    setManualCity(city);
    setSource("city");
    try { localStorage.setItem(CITY_KEY, city); } catch {}
  }, [fastfoods]);

  // Géolocalisation GPS (sur demande explicite uniquement).
  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setManualCity(null);
        setSource("gps");
        setLocating(false);
        try { localStorage.removeItem(CITY_KEY); } catch {}
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []);

  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setManualCity(null);
    setSource(null);
    try { localStorage.removeItem(CITY_KEY); } catch {}
  }, []);

  // Restaure la ville sauvegardée quand les restos sont chargés (aucun GPS automatique).
  useEffect(() => {
    if (source || !fastfoods.length) return;
    try {
      const saved = localStorage.getItem(CITY_KEY);
      if (saved) setCity(saved);
    } catch {}
  }, [fastfoods, source, setCity]);

  const zone = useMemo(
    () => (userLocation ? getUserZone(userLocation, fastfoods) : null),
    [userLocation, fastfoods],
  );
  const label = manualCity ?? zone?.label ?? null;

  const value = useMemo(
    () => ({ userLocation, zone, label, locating, source, cities, requestLocation, setCity, clearLocation }),
    [userLocation, zone, label, locating, source, cities, requestLocation, setCity, clearLocation],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationContext doit être utilisé dans un LocationProvider");
  return ctx;
}
