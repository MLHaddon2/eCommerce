import { useEffect, useState } from "react";

function useGeoLocation() {
  const [location, setLocation] = useState(null);

  // --- 1. Browser geolocation ---
  const getBrowserLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            type: "browser",
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        (err) => reject(err),
        { timeout: 5000 }
      );
    });

  // --- 2. IP fallback ---
  const getIPLocation = async () => {
    const res = await fetch("http://ip-api.com/json");
    const data = await res.json();
    return { type: "ip", ...data };
  };

  // --- 3. Permission-aware logic ---
  const getLocation = async () => {
    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "granted") {
        const browserLoc = await getBrowserLocation();
        const res = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${browserLoc.lat}+${browserLoc.lon}&key=${'bb756d3d629b47538afea28187bd44cb'}`
        );
        if (!res.ok) throw new Error("Failed to fetch location data");

        const data = await res.json();
        setLocation(data.results[0].components.state_code);
        return;
      }

      if (permission.state === "prompt") {
        try {
          const browserLoc = await getBrowserLocation();
          const res = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${browserLoc.lat}+${browserLoc.lon}&key=${'bb756d3d629b47538afea28187bd44cb'}`
          );
          if (!res.ok) throw new Error("Failed to fetch location data");

          const data = await res.json();
          setLocation(data.results[0].components.state_code);
          return;
        } catch {
          const ipLoc = await getIPLocation();
          setLocation(ipLoc);
          return;
        }
      }

      if (permission.state === "denied") {
        const ipLoc = await getIPLocation();
        setLocation(ipLoc);
        return;
      }
    } catch (err) {
      // Permissions API not supported → fallback
      // const ipLoc = await getIPLocation();
      // setLocation(ipLoc);
      console.log(err);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return location;
}

export default useGeoLocation;
