// Geospatial helpers — mirrors a PostGIS ST_DistanceSphere radius query in the browser.
const EARTH_RADIUS_KM = 6371;

const toRad = (deg) => (deg * Math.PI) / 180;

export function haversineKm(a, b) {
  if (!a || !b) return null;
  const { lat: lat1, lng: lng1 } = a;
  const { lat: lat2, lng: lng2 } = b;
  if ([lat1, lng1, lat2, lng2].some((v) => typeof v !== "number" || Number.isNaN(v))) return null;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function schoolCoords(school) {
  if (!school) return null;
  const lat = Number(school.latitude);
  const lng = Number(school.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng) || (!lat && !lng)) return null;
  return { lat, lng };
}

export function distanceToSchool(school, origin) {
  return haversineKm(origin, schoolCoords(school));
}

export function formatMoney(value, currency = "USD") {
  const amount = Number(value);
  if (value === null || value === undefined || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDistance(km) {
  if (km === null || km === undefined || Number.isNaN(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`;
}

export function tuitionRange(school) {
  const min = Number(school?.tuition_min) || 0;
  const max = Number(school?.tuition_max) || 0;
  const currency = school?.currency || "USD";
  if (!min && !max) return "Tuition on request";
  if (min && max && min !== max)
    return `${formatMoney(min, currency)} – ${formatMoney(max, currency)} / yr`;
  return `${formatMoney(min || max, currency)} / yr`;
}

export function requestOrigin() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not available in this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("We could not access your location")),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  });
}