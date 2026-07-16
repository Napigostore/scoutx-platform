/** ISO 3166-1 country. */
export interface Country {
  readonly code: string;
  readonly name: string;
}

const COUNTRY_CODE = /^[A-Z]{2}$/;

export function isValidCountry(country: Country): boolean {
  return COUNTRY_CODE.test(country.code) && country.name.trim().length > 0;
}

export function createCountry(code: string, name: string): Country {
  const country: Country = {
    code: code.toUpperCase(),
    name: name.trim(),
  };

  if (!isValidCountry(country)) {
    throw new Error("Invalid Country value");
  }

  return country;
}
