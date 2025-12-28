/**
 * Popular streaming and subscription services.
 * Used by the ServicePickerSheet for quick selection.
 */

import { SubscriptionCategory } from '@/src/features/subscriptions/types';

export interface Service {
  id: string;
  name: string;
  category: SubscriptionCategory;
  domain?: string;
}

export const SERVICES: Service[] = [
  // Streaming Services
  { id: 'netflix', name: 'Netflix', category: 'Streaming', domain: 'netflix.com' },
  { id: 'disney-plus', name: 'Disney+', category: 'Streaming', domain: 'disneyplus.com' },
  { id: 'hbo-max', name: 'HBO Max', category: 'Streaming', domain: 'max.com' },
  { id: 'hulu', name: 'Hulu', category: 'Streaming', domain: 'hulu.com' },
  {
    id: 'amazon-prime-video',
    name: 'Amazon Prime Video',
    category: 'Streaming',
    domain: 'amazon.com',
  },
  { id: 'apple-tv-plus', name: 'Apple TV+', category: 'Streaming', domain: 'tv.apple.com' },
  { id: 'paramount-plus', name: 'Paramount+', category: 'Streaming', domain: 'paramountplus.com' },
  { id: 'peacock', name: 'Peacock', category: 'Streaming', domain: 'peacocktv.com' },
  { id: 'crunchyroll', name: 'Crunchyroll', category: 'Streaming', domain: 'crunchyroll.com' },
  { id: 'youtube-premium', name: 'YouTube Premium', category: 'Streaming', domain: 'youtube.com' },
  { id: 'discovery-plus', name: 'Discovery+', category: 'Streaming', domain: 'discoveryplus.com' },
  { id: 'espn-plus', name: 'ESPN+', category: 'Streaming', domain: 'plus.espn.com' },
  { id: 'showtime', name: 'Showtime', category: 'Streaming', domain: 'sho.com' },
  { id: 'starz', name: 'Starz', category: 'Streaming', domain: 'starz.com' },
  { id: 'britbox', name: 'BritBox', category: 'Streaming', domain: 'britbox.com' },
  { id: 'mubi', name: 'Mubi', category: 'Streaming', domain: 'mubi.com' },
  { id: 'shudder', name: 'Shudder', category: 'Streaming', domain: 'shudder.com' },
  { id: 'tubi', name: 'Tubi', category: 'Streaming', domain: 'tubitv.com' },
  { id: 'pluto-tv', name: 'Pluto TV', category: 'Streaming', domain: 'pluto.tv' },

  // Music Services
  { id: 'spotify', name: 'Spotify', category: 'Music', domain: 'spotify.com' },
  { id: 'apple-music', name: 'Apple Music', category: 'Music', domain: 'music.apple.com' },
  { id: 'amazon-music', name: 'Amazon Music', category: 'Music', domain: 'music.amazon.com' },
  { id: 'youtube-music', name: 'YouTube Music', category: 'Music', domain: 'music.youtube.com' },
  { id: 'tidal', name: 'Tidal', category: 'Music', domain: 'tidal.com' },
  { id: 'deezer', name: 'Deezer', category: 'Music', domain: 'deezer.com' },
  { id: 'pandora', name: 'Pandora', category: 'Music', domain: 'pandora.com' },
  { id: 'soundcloud-go', name: 'SoundCloud Go', category: 'Music', domain: 'soundcloud.com' },
  { id: 'audible', name: 'Audible', category: 'Music', domain: 'audible.com' },

  // Software & Cloud Services
  { id: 'microsoft-365', name: 'Microsoft 365', category: 'Software', domain: 'microsoft.com' },
  {
    id: 'adobe-creative-cloud',
    name: 'Adobe Creative Cloud',
    category: 'Software',
    domain: 'adobe.com',
  },
  { id: 'dropbox', name: 'Dropbox', category: 'Software', domain: 'dropbox.com' },
  { id: 'google-one', name: 'Google One', category: 'Software', domain: 'one.google.com' },
  { id: 'icloud-plus', name: 'iCloud+', category: 'Software', domain: 'icloud.com' },
  { id: 'onedrive', name: 'OneDrive', category: 'Software', domain: 'onedrive.com' },
  { id: 'github', name: 'GitHub', category: 'Software', domain: 'github.com' },
  { id: 'notion', name: 'Notion', category: 'Software', domain: 'notion.so' },
  { id: 'slack', name: 'Slack', category: 'Software', domain: 'slack.com' },
  { id: 'zoom', name: 'Zoom', category: 'Software', domain: 'zoom.us' },
  { id: 'canva-pro', name: 'Canva Pro', category: 'Software', domain: 'canva.com' },
  { id: 'figma', name: 'Figma', category: 'Software', domain: 'figma.com' },
  { id: '1password', name: '1Password', category: 'Software', domain: '1password.com' },
  { id: 'lastpass', name: 'LastPass', category: 'Software', domain: 'lastpass.com' },
  { id: 'bitwarden', name: 'Bitwarden', category: 'Software', domain: 'bitwarden.com' },
  { id: 'nordvpn', name: 'NordVPN', category: 'Software', domain: 'nordvpn.com' },
  { id: 'expressvpn', name: 'ExpressVPN', category: 'Software', domain: 'expressvpn.com' },
  { id: 'surfshark', name: 'Surfshark', category: 'Software', domain: 'surfshark.com' },
  { id: 'grammarly', name: 'Grammarly', category: 'Software', domain: 'grammarly.com' },

  // Utilities
  { id: 'electric', name: 'Electric', category: 'Utilities' },
  { id: 'gas', name: 'Gas', category: 'Utilities' },
  { id: 'water', name: 'Water', category: 'Utilities' },
  { id: 'internet', name: 'Internet', category: 'Utilities' },
  { id: 'phone', name: 'Phone', category: 'Utilities' },
  { id: 'cable-tv', name: 'Cable TV', category: 'Utilities' },
  { id: 'gym-membership', name: 'Gym Membership', category: 'Utilities' },
  { id: 'insurance', name: 'Insurance', category: 'Utilities' },

  // Other / Gaming
  { id: 'xbox-game-pass', name: 'Xbox Game Pass', category: 'Other', domain: 'xbox.com' },
  {
    id: 'playstation-plus',
    name: 'PlayStation Plus',
    category: 'Other',
    domain: 'playstation.com',
  },
  {
    id: 'nintendo-switch-online',
    name: 'Nintendo Switch Online',
    category: 'Other',
    domain: 'nintendo.com',
  },
  { id: 'ea-play', name: 'EA Play', category: 'Other', domain: 'ea.com' },
  { id: 'twitch', name: 'Twitch', category: 'Other', domain: 'twitch.tv' },
  { id: 'patreon', name: 'Patreon', category: 'Other', domain: 'patreon.com' },
  { id: 'substack', name: 'Substack', category: 'Other', domain: 'substack.com' },
  { id: 'medium', name: 'Medium', category: 'Other', domain: 'medium.com' },
  { id: 'new-york-times', name: 'The New York Times', category: 'Other', domain: 'nytimes.com' },
  {
    id: 'washington-post',
    name: 'The Washington Post',
    category: 'Other',
    domain: 'washingtonpost.com',
  },
  { id: 'wall-street-journal', name: 'Wall Street Journal', category: 'Other', domain: 'wsj.com' },
  { id: 'the-athletic', name: 'The Athletic', category: 'Other', domain: 'theathletic.com' },
];

/**
 * Look up the domain for a service by its name.
 * Returns undefined if no matching service or domain is found.
 */
export function getServiceDomain(serviceName: string): string | undefined {
  const service = SERVICES.find((s) => s.name.toLowerCase() === serviceName.toLowerCase());
  return service?.domain;
}
