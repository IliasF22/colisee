"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { useFastFoods } from "./hooks";
import { getUserZone, Zone } from "./zones";
import { UserLocation } from "./geo";

interface LocationContextValue {
  userLocation: UserLocation | null;
  zone: Zone | null;
  locating: boolean;
  requestLocation: () => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { fastfoods } = useFastFoods();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []);

  // Demande la position une seule fois au montage de l'app.
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const zone = useMemo(
    () => (userLocation ? getUserZone(userLocation, fastfoods) : null),
    [userLocation, fastfoods],
  );

  const value = useMemo(
    () => ({ userLocation, zone, locating, requestLocation }),
    [userLocation, zone, locating, requestLocation],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationContext doit être utilisé dans un LocationProvider");
  return ctx;
}
