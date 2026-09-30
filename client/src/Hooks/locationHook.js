import { useEffect, useState } from "react";

// Best-effort guess of the visitor's US state code (e.g. "CA"), used to pre-fill the
// checkout shipping state. Returns null until (or unless) a state is found — the user
// can always pick the state themselves.
//
// 1. Browser geolocation (if permitted) → OpenCage reverse geocoding.
//    Needs REACT_APP_OPENCAGE_KEY; skipped if it isn't set.
// 2. Otherwise, IP-based lookup via ipapi.co (HTTPS, so it works on an HTTPS site).

const OPENCAGE_KEY = process.env.REACT_APP_OPENCAGE_KEY;

const getBrowserPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      reject,
      { timeout: 5000 }
    );
  });

const stateFromBrowser = async () => {
  if (!OPENCAGE_KEY) return null;
  const { lat, lon } = await getBrowserPosition();
  const res = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${encodeURIComponent(OPENCAGE_KEY)}&no_annotations=1`
  );
  if (!res.ok) throw new Error("Failed to fetch location data");
  const data = await res.json();
  const components = data.results?.[0]?.components;
  return components?.country_code === "us" ? components.state_code || null : null;
};

const stateFromIp = async () => {
  const res = await fetch("https://ipapi.co/json/");
  if (!res.ok) return null;
  const data = await res.json();
  return data.country_code === "US" ? data.region_code || null : null;
};

const canUseBrowserLocation = async () => {
  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    return permission.state !== "denied";
  } catch {
    return Boolean(navigator.geolocation); // Permissions API not supported
  }
};

function useGeoLocation() {
  const [stateCode, setStateCode] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      let code = null;
      if (await canUseBrowserLocation()) {
        code = await stateFromBrowser().catch(() => null);
      }
      if (!code) {
        code = await stateFromIp().catch(() => null);
      }
      if (!cancelled && code) setStateCode(code.toUpperCase());
    };

    detect();
    return () => { cancelled = true; };
  }, []);

  return stateCode;
}

export default useGeoLocation;
