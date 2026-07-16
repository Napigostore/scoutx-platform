/** WGS84 geographic coordinate. */
export interface GeoPoint {
  readonly latitude: number;
  readonly longitude: number;
  readonly altitudeMeters?: number;
  readonly accuracyMeters?: number;
}

export function isValidGeoPoint(point: GeoPoint): boolean {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    point.longitude >= -180 &&
    point.longitude <= 180 &&
    (point.altitudeMeters === undefined || Number.isFinite(point.altitudeMeters)) &&
    (point.accuracyMeters === undefined ||
      (Number.isFinite(point.accuracyMeters) && point.accuracyMeters >= 0))
  );
}

export function createGeoPoint(
  latitude: number,
  longitude: number,
  options?: Readonly<{ altitudeMeters?: number; accuracyMeters?: number }>,
): GeoPoint {
  const point: GeoPoint = {
    latitude,
    longitude,
    ...(options?.altitudeMeters !== undefined ? { altitudeMeters: options.altitudeMeters } : {}),
    ...(options?.accuracyMeters !== undefined ? { accuracyMeters: options.accuracyMeters } : {}),
  };

  if (!isValidGeoPoint(point)) {
    throw new Error("Invalid GeoPoint coordinates");
  }

  return point;
}
