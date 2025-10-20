export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'nl', label: 'Dutch' },
  { value: 'de', label: 'German' },
  { value: 'tr', label: 'Turkish' },
] as const;

export function getLanguageLabel(value: string): string {
  return LANGUAGE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
