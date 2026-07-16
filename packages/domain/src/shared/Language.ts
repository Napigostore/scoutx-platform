/** BCP 47 / ISO 639 language tag. */
export interface Language {
  readonly code: string;
  readonly name: string;
  readonly nativeName?: string;
}

const LANGUAGE_CODE = /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/;

export function isValidLanguage(language: Language): boolean {
  return LANGUAGE_CODE.test(language.code) && language.name.trim().length > 0;
}

export function createLanguage(code: string, name: string, nativeName?: string): Language {
  const language: Language = {
    code: code.toLowerCase(),
    name: name.trim(),
    ...(nativeName !== undefined ? { nativeName: nativeName.trim() } : {}),
  };

  if (!isValidLanguage(language)) {
    throw new Error("Invalid Language value");
  }

  return language;
}
