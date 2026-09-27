const EARTH_RADIUS_KM = 6371;

function distanceKm(latitude1, longitude1, latitude2, longitude2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const deltaLatitude = toRadians(latitude2 - latitude1);
  const deltaLongitude = toRadians(longitude2 - longitude1);
  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(toRadians(latitude1))
    * Math.cos(toRadians(latitude2))
    * Math.sin(deltaLongitude / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseCoordinates(query) {
  const latitude = Number(query.latitude);
  const longitude = Number(query.longitude);
  if (query.latitude === undefined || query.longitude === undefined
    || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return null;
  }
  return { latitude, longitude };
}

function sortByDistance(items, latitude, longitude, limit = 10) {
  return items.map((item) => {
    const resource = typeof item.toObject === 'function' ? item.toObject() : item;
    return {
      ...resource,
      distanceKm: Number(distanceKm(latitude, longitude, resource.latitude, resource.longitude).toFixed(1)),
    };
  }).sort((first, second) => first.distanceKm - second.distanceKm).slice(0, limit);
}

module.exports = { distanceKm, parseCoordinates, sortByDistance };