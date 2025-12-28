// ─────────────────────────────────────────────────────────────────────────────
// useServiceLogo - Simple URL generator (no pre-validation)
// ─────────────────────────────────────────────────────────────────────────────
//
// Why no validation?
// - HEAD requests are unreliable on mobile (CORS, redirects, etc.)
// - GET requests for validation download entire images = slow + expensive
// - expo-image handles errors gracefully with onError callback
// - This approach is simpler, faster, and more reliable
//

const LOGO_DEV_TOKEN = process.env.EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY;

/**
 * Generates the logo.dev URL for a given domain.
 */
export function getLogoUrl(domain: string): string {
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}`;
}

type UseServiceLogoResult = {
  /** The logo URL to try loading, or null if no domain/token */
  logoUrl: string | null;
};

/**
 * Hook to get a service logo URL from logo.dev.
 *
 * This hook does NOT pre-validate the URL. Instead:
 * - It returns the URL immediately
 * - The ServiceLogo component uses expo-image's onError to fall back
 *
 * This approach is more reliable because:
 * - No extra network requests for validation
 * - expo-image has built-in caching (disk + memory)
 * - Works offline once cached by expo-image
 */
export function useServiceLogo(domain?: string): UseServiceLogoResult {
  if (!domain || !LOGO_DEV_TOKEN) {
    return { logoUrl: null };
  }

  return { logoUrl: getLogoUrl(domain) };
}
