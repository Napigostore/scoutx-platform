import type { Country } from "./Country.js";
import type { GeoPoint } from "./GeoPoint.js";

/** Named city within a country, optionally geotagged. */
export interface City {
  readonly id: string;
  readonly name: string;
  readonly country: Country;
  readonly coordinates?: GeoPoint;
  readonly timezone?: string;
}

export function isValidCity(city: City): boolean {
  return city.id.trim().length > 0 && city.name.trim().length > 0;
}

export function createCity(
  id: string,
  name: string,
  country: Country,
  options?: Readonly<{ coordinates?: GeoPoint; timezone?: string }>,
): City {
  const city: City = {
    id: id.trim(),
    name: name.trim(),
    country,
    ...(options?.coordinates !== undefined ? { coordinates: options.coordinates } : {}),
    ...(options?.timezone !== undefined ? { timezone: options.timezone } : {}),
  };

  if (!isValidCity(city)) {
    throw new Error("Invalid City value");
  }

  return city;
}
