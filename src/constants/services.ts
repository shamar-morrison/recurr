/**
 * Popular streaming and subscription services.
 * Used by the ServicePickerSheet for quick selection.
 *
 * Prices are approximate monthly USD values (as of late 2024).
 * Users can edit these after selection.
 */

import { SubscriptionCategory } from '@/src/features/subscriptions/types';

export interface Service {
  id: string;
  name: string;
  category: SubscriptionCategory;
  domain?: string;
  /** Default monthly price in USD (approximate) */
  defaultPriceUSD?: number;
}

export const SERVICES: Service[] = [
  // Streaming Services
  {
    id: 'netflix',
    name: 'Netflix',
    category: 'Streaming',
    domain: 'netflix.com',
    defaultPriceUSD: 15.49,
  },
  {
    id: 'disney-plus',
    name: 'Disney+',
    category: 'Streaming',
    domain: 'disneyplus.com',
    defaultPriceUSD: 13.99,
  },
  {
    id: 'hbo-max',
    name: 'HBO Max',
    category: 'Streaming',
    domain: 'max.com',
    defaultPriceUSD: 15.99,
  },
  { id: 'hulu', name: 'Hulu', category: 'Streaming', domain: 'hulu.com', defaultPriceUSD: 17.99 },
  {
    id: 'amazon-prime-video',
    name: 'Amazon Prime Video',
    category: 'Streaming',
    domain: 'amazon.com',
    defaultPriceUSD: 8.99,
  },
  {
    id: 'apple-tv-plus',
    name: 'Apple TV+',
    category: 'Streaming',
    domain: 'tv.apple.com',
    defaultPriceUSD: 9.99,
  },
  {
    id: 'paramount-plus',
    name: 'Paramount+',
    category: 'Streaming',
    domain: 'paramountplus.com',
    defaultPriceUSD: 11.99,
  },
  {
    id: 'peacock',
    name: 'Peacock',
    category: 'Streaming',
    domain: 'peacocktv.com',
    defaultPriceUSD: 7.99,
  },
  {
    id: 'crunchyroll',
    name: 'Crunchyroll',
    category: 'Streaming',
    domain: 'crunchyroll.com',
    defaultPriceUSD: 7.99,
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    category: 'Streaming',
    domain: 'youtube.com',
    defaultPriceUSD: 13.99,
  },
  {
    id: 'discovery-plus',
    name: 'Discovery+',
    category: 'Streaming',
    domain: 'discoveryplus.com',
    defaultPriceUSD: 8.99,
  },
  {
    id: 'espn-plus',
    name: 'ESPN+',
    category: 'Streaming',
    domain: 'plus.espn.com',
    defaultPriceUSD: 10.99,
  },
  {
    id: 'showtime',
    name: 'Showtime',
    category: 'Streaming',
    domain: 'sho.com',
    defaultPriceUSD: 10.99,
  },
  { id: 'starz', name: 'Starz', category: 'Streaming', domain: 'starz.com', defaultPriceUSD: 9.99 },
  {
    id: 'britbox',
    name: 'BritBox',
    category: 'Streaming',
    domain: 'britbox.com',
    defaultPriceUSD: 8.99,
  },
  { id: 'mubi', name: 'Mubi', category: 'Streaming', domain: 'mubi.com', defaultPriceUSD: 14.99 },
  {
    id: 'shudder',
    name: 'Shudder',
    category: 'Streaming',
    domain: 'shudder.com',
    defaultPriceUSD: 5.99,
  },
  { id: 'tubi', name: 'Tubi', category: 'Streaming', domain: 'tubitv.com' }, // Free
  { id: 'pluto-tv', name: 'Pluto TV', category: 'Streaming', domain: 'pluto.tv' }, // Free

  // Music Services
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'Music',
    domain: 'spotify.com',
    defaultPriceUSD: 11.99,
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    category: 'Music',
    domain: 'music.apple.com',
    defaultPriceUSD: 10.99,
  },
  {
    id: 'amazon-music',
    name: 'Amazon Music',
    category: 'Music',
    domain: 'music.amazon.com',
    defaultPriceUSD: 9.99,
  },
  {
    id: 'youtube-music',
    name: 'YouTube Music',
    category: 'Music',
    domain: 'music.youtube.com',
    defaultPriceUSD: 10.99,
  },
  { id: 'tidal', name: 'Tidal', category: 'Music', domain: 'tidal.com', defaultPriceUSD: 10.99 },
  { id: 'deezer', name: 'Deezer', category: 'Music', domain: 'deezer.com', defaultPriceUSD: 10.99 },
  {
    id: 'pandora',
    name: 'Pandora',
    category: 'Music',
    domain: 'pandora.com',
    defaultPriceUSD: 10.99,
  },
  {
    id: 'soundcloud-go',
    name: 'SoundCloud Go',
    category: 'Music',
    domain: 'soundcloud.com',
    defaultPriceUSD: 9.99,
  },
  {
    id: 'audible',
    name: 'Audible',
    category: 'Music',
    domain: 'audible.com',
    defaultPriceUSD: 14.95,
  },

  // Software & Cloud Services
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    category: 'Software',
    domain: 'microsoft.com',
    defaultPriceUSD: 9.99,
  },
  {
    id: 'adobe-creative-cloud',
    name: 'Adobe Creative Cloud',
    category: 'Software',
    domain: 'adobe.com',
    defaultPriceUSD: 59.99,
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'Software',
    domain: 'dropbox.com',
    defaultPriceUSD: 11.99,
  },
  {
    id: 'google-one',
    name: 'Google One',
    category: 'Software',
    domain: 'one.google.com',
    defaultPriceUSD: 2.99,
  },
  {
    id: 'icloud-plus',
    name: 'iCloud+',
    category: 'Software',
    domain: 'icloud.com',
    defaultPriceUSD: 2.99,
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    category: 'Software',
    domain: 'onedrive.com',
    defaultPriceUSD: 1.99,
  },
  { id: 'github', name: 'GitHub', category: 'Software', domain: 'github.com', defaultPriceUSD: 4 },
  { id: 'notion', name: 'Notion', category: 'Software', domain: 'notion.so', defaultPriceUSD: 10 },
  { id: 'slack', name: 'Slack', category: 'Software', domain: 'slack.com', defaultPriceUSD: 8.75 },
  { id: 'zoom', name: 'Zoom', category: 'Software', domain: 'zoom.us', defaultPriceUSD: 15.99 },
  {
    id: 'canva-pro',
    name: 'Canva Pro',
    category: 'Software',
    domain: 'canva.com',
    defaultPriceUSD: 14.99,
  },
  { id: 'figma', name: 'Figma', category: 'Software', domain: 'figma.com', defaultPriceUSD: 15 },
  {
    id: '1password',
    name: '1Password',
    category: 'Software',
    domain: '1password.com',
    defaultPriceUSD: 2.99,
  },
  {
    id: 'lastpass',
    name: 'LastPass',
    category: 'Software',
    domain: 'lastpass.com',
    defaultPriceUSD: 3,
  },
  {
    id: 'bitwarden',
    name: 'Bitwarden',
    category: 'Software',
    domain: 'bitwarden.com',
    defaultPriceUSD: 3.33,
  },
  {
    id: 'nordvpn',
    name: 'NordVPN',
    category: 'Software',
    domain: 'nordvpn.com',
    defaultPriceUSD: 12.99,
  },
  {
    id: 'expressvpn',
    name: 'ExpressVPN',
    category: 'Software',
    domain: 'expressvpn.com',
    defaultPriceUSD: 12.95,
  },
  {
    id: 'surfshark',
    name: 'Surfshark',
    category: 'Software',
    domain: 'surfshark.com',
    defaultPriceUSD: 15.45,
  },
  {
    id: 'grammarly',
    name: 'Grammarly',
    category: 'Software',
    domain: 'grammarly.com',
    defaultPriceUSD: 12,
  },

  // Utilities (no default prices - vary by region/provider)
  { id: 'electric', name: 'Electric', category: 'Utilities' },
  { id: 'gas', name: 'Gas', category: 'Utilities' },
  { id: 'water', name: 'Water', category: 'Utilities' },
  { id: 'internet', name: 'Internet', category: 'Utilities' },
  { id: 'phone', name: 'Phone', category: 'Utilities' },
  { id: 'cable-tv', name: 'Cable TV', category: 'Utilities' },
  { id: 'gym-membership', name: 'Gym Membership', category: 'Utilities' },
  { id: 'insurance', name: 'Insurance', category: 'Utilities' },

  // Other / Gaming
  {
    id: 'xbox-game-pass',
    name: 'Xbox Game Pass',
    category: 'Other',
    domain: 'xbox.com',
    defaultPriceUSD: 16.99,
  },
  {
    id: 'playstation-plus',
    name: 'PlayStation Plus',
    category: 'Other',
    domain: 'playstation.com',
    defaultPriceUSD: 17.99,
  },
  {
    id: 'nintendo-switch-online',
    name: 'Nintendo Switch Online',
    category: 'Other',
    domain: 'nintendo.com',
    defaultPriceUSD: 3.99,
  },
  { id: 'ea-play', name: 'EA Play', category: 'Other', domain: 'ea.com', defaultPriceUSD: 4.99 },
  { id: 'twitch', name: 'Twitch', category: 'Other', domain: 'twitch.tv', defaultPriceUSD: 9.99 },
  { id: 'patreon', name: 'Patreon', category: 'Other', domain: 'patreon.com' }, // Varies
  { id: 'substack', name: 'Substack', category: 'Other', domain: 'substack.com' }, // Varies
  { id: 'medium', name: 'Medium', category: 'Other', domain: 'medium.com', defaultPriceUSD: 5 },
  {
    id: 'new-york-times',
    name: 'The New York Times',
    category: 'Other',
    domain: 'nytimes.com',
    defaultPriceUSD: 17,
  },
  {
    id: 'washington-post',
    name: 'The Washington Post',
    category: 'Other',
    domain: 'washingtonpost.com',
    defaultPriceUSD: 10,
  },
  {
    id: 'wall-street-journal',
    name: 'Wall Street Journal',
    category: 'Other',
    domain: 'wsj.com',
    defaultPriceUSD: 12.99,
  },
  {
    id: 'the-athletic',
    name: 'The Athletic',
    category: 'Other',
    domain: 'theathletic.com',
    defaultPriceUSD: 9.99,
  },
];

/**
 * Look up the domain for a service by its name.
 * Returns undefined if no matching service or domain is found.
 */
export function getServiceDomain(serviceName: string): string | undefined {
  const service = SERVICES.find((s) => s.name.toLowerCase() === serviceName.toLowerCase());
  return service?.domain;
}

/**
 * Look up a service by its name.
 */
export function getServiceByName(serviceName: string): Service | undefined {
  return SERVICES.find((s) => s.name.toLowerCase() === serviceName.toLowerCase());
}

/**
 * Get the default USD price for a service by name.
 * Returns undefined if no matching service or default price is found.
 */
export function getServiceDefaultPriceUSD(serviceName: string): number | undefined {
  const service = getServiceByName(serviceName);
  return service?.defaultPriceUSD;
}
