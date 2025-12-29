/**
 * Date format options for the app.
 * Users can select their preferred date display format in Settings.
 */

export type DateFormatId =
  | 'system'
  | 'DD/MM/YYYY'
  | 'MM/DD/YYYY'
  | 'YYYY/MM/DD'
  | 'DD-MM-YYYY'
  | 'YYYY-MM-DD'
  | 'DD.MM.YYYY';

export type DateFormatOption = {
  id: DateFormatId;
  label: string;
  example: string;
};

/**
 * All available date format options.
 * The example dates shown use December 31, 2024 as reference.
 */
export const DATE_FORMAT_OPTIONS: DateFormatOption[] = [
  { id: 'system', label: 'System default', example: '' },
  { id: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '31/12/2024' },
  { id: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '12/31/2024' },
  { id: 'YYYY/MM/DD', label: 'YYYY/MM/DD', example: '2024/12/31' },
  { id: 'DD-MM-YYYY', label: 'DD-MM-YYYY', example: '31-12-2024' },
  { id: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2024-12-31' },
  { id: 'DD.MM.YYYY', label: 'DD.MM.YYYY', example: '31.12.2024' },
];

/**
 * Set of all valid DateFormatId values for O(1) validation lookup.
 * Used to validate values from external sources like Firestore.
 */
export const VALID_DATE_FORMAT_IDS: ReadonlySet<string> = new Set(
  DATE_FORMAT_OPTIONS.map((o) => o.id)
);

/**
 * Type guard to check if a value is a valid DateFormatId.
 * Use this to safely validate values from external sources before casting.
 * @param value - The value to check
 * @returns True if value is a valid DateFormatId
 */
export function isValidDateFormatId(value: unknown): value is DateFormatId {
  return typeof value === 'string' && VALID_DATE_FORMAT_IDS.has(value);
}

/** Default date format */
export const DEFAULT_DATE_FORMAT: DateFormatId = 'MM/DD/YYYY';

/**
 * Get the label for a date format ID.
 */
export function getDateFormatLabel(formatId: DateFormatId): string {
  const option = DATE_FORMAT_OPTIONS.find((o) => o.id === formatId);
  return option?.label ?? 'System default';
}

/**
 * Format a date according to the specified format ID.
 * @param date - The date to format
 * @param formatId - The format ID to use
 * @returns Formatted date string
 */
export function formatDate(date: Date, formatId: DateFormatId = DEFAULT_DATE_FORMAT): string {
  // System default uses the device locale
  if (formatId === 'system') {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  switch (formatId) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD.MM.YYYY':
      return `${day}.${month}.${year}`;
    default: {
      // Exhaustiveness check: ensures all DateFormatId cases are handled
      const _exhaustiveCheck: never = formatId;
      return _exhaustiveCheck;
    }
  }
}

/**
 * Generate an example date string for a given format.
 * Uses a fixed reference date (December 31, 2024) for consistency.
 */
export function getExampleDate(formatId: DateFormatId): string {
  const option = DATE_FORMAT_OPTIONS.find((o) => o.id === formatId);
  if (option?.example) {
    return option.example;
  }
  // For system default, generate using current locale
  const referenceDate = new Date(2024, 11, 31); // Dec 31, 2024
  return formatDate(referenceDate, formatId);
}
