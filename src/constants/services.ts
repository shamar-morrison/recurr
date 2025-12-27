/**
 * Popular streaming and subscription services.
 * Used by the ServicePickerSheet for quick selection.
 */

export interface Service {
  name: string;
  category: 'Streaming' | 'Music' | 'Software' | 'Utilities' | 'Other';
}

export const SERVICES: Service[] = [
  // Streaming Services
  { name: 'Netflix', category: 'Streaming' },
  { name: 'Disney+', category: 'Streaming' },
  { name: 'HBO Max', category: 'Streaming' },
  { name: 'Hulu', category: 'Streaming' },
  { name: 'Amazon Prime Video', category: 'Streaming' },
  { name: 'Apple TV+', category: 'Streaming' },
  { name: 'Paramount+', category: 'Streaming' },
  { name: 'Peacock', category: 'Streaming' },
  { name: 'Crunchyroll', category: 'Streaming' },
  { name: 'YouTube Premium', category: 'Streaming' },
  { name: 'Discovery+', category: 'Streaming' },
  { name: 'ESPN+', category: 'Streaming' },
  { name: 'Showtime', category: 'Streaming' },
  { name: 'Starz', category: 'Streaming' },
  { name: 'BritBox', category: 'Streaming' },
  { name: 'Mubi', category: 'Streaming' },
  { name: 'Shudder', category: 'Streaming' },
  { name: 'Tubi', category: 'Streaming' },
  { name: 'Pluto TV', category: 'Streaming' },

  // Music Services
  { name: 'Spotify', category: 'Music' },
  { name: 'Apple Music', category: 'Music' },
  { name: 'Amazon Music', category: 'Music' },
  { name: 'YouTube Music', category: 'Music' },
  { name: 'Tidal', category: 'Music' },
  { name: 'Deezer', category: 'Music' },
  { name: 'Pandora', category: 'Music' },
  { name: 'SoundCloud Go', category: 'Music' },
  { name: 'Audible', category: 'Music' },

  // Software & Cloud Services
  { name: 'Microsoft 365', category: 'Software' },
  { name: 'Adobe Creative Cloud', category: 'Software' },
  { name: 'Dropbox', category: 'Software' },
  { name: 'Google One', category: 'Software' },
  { name: 'iCloud+', category: 'Software' },
  { name: 'OneDrive', category: 'Software' },
  { name: 'GitHub', category: 'Software' },
  { name: 'Notion', category: 'Software' },
  { name: 'Slack', category: 'Software' },
  { name: 'Zoom', category: 'Software' },
  { name: 'Canva Pro', category: 'Software' },
  { name: 'Figma', category: 'Software' },
  { name: '1Password', category: 'Software' },
  { name: 'LastPass', category: 'Software' },
  { name: 'Bitwarden', category: 'Software' },
  { name: 'NordVPN', category: 'Software' },
  { name: 'ExpressVPN', category: 'Software' },
  { name: 'Surfshark', category: 'Software' },
  { name: 'Grammarly', category: 'Software' },

  // Utilities
  { name: 'Electric', category: 'Utilities' },
  { name: 'Gas', category: 'Utilities' },
  { name: 'Water', category: 'Utilities' },
  { name: 'Internet', category: 'Utilities' },
  { name: 'Phone', category: 'Utilities' },
  { name: 'Cable TV', category: 'Utilities' },
  { name: 'Gym Membership', category: 'Utilities' },
  { name: 'Insurance', category: 'Utilities' },

  // Other / Gaming
  { name: 'Xbox Game Pass', category: 'Other' },
  { name: 'PlayStation Plus', category: 'Other' },
  { name: 'Nintendo Switch Online', category: 'Other' },
  { name: 'EA Play', category: 'Other' },
  { name: 'Twitch', category: 'Other' },
  { name: 'Patreon', category: 'Other' },
  { name: 'Substack', category: 'Other' },
  { name: 'Medium', category: 'Other' },
  { name: 'The New York Times', category: 'Other' },
  { name: 'The Washington Post', category: 'Other' },
  { name: 'Wall Street Journal', category: 'Other' },
  { name: 'The Athletic', category: 'Other' },
];
