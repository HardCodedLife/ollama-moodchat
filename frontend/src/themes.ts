// MoodChat Theme System - 12 distinct emotional themes with unique visual characteristics

export interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  gradientStart: string;
  gradientEnd: string;
  messageUserBg: string;
  messageAssistantBg: string;
  borderColor: string;
  shadowColor: string;
  icon: string;
}

export const themes: Record<string, Theme> = {
  romance: {
    id: 'romance',
    name: 'Romance',
    primaryColor: '#ff4d6d',
    secondaryColor: '#ff85a2',
    backgroundColor: '#ffe6ea',
    textColor: '#4a2a3a',
    accentColor: '#ffb3c6',
    gradientStart: '#ff758f',
    gradientEnd: '#ff4d6d',
    messageUserBg: '#ff85a2',
    messageAssistantBg: '#ffd1dc',
    borderColor: '#ff99aa',
    shadowColor: 'rgba(255, 105, 180, 0.3)',
    icon: '💕'
  },

  adventure: {
    id: 'adventure',
    name: 'Adventure',
    primaryColor: '#ff6b35',
    secondaryColor: '#f7931e',
    backgroundColor: '#fff8e1',
    textColor: '#3e2723',
    accentColor: '#ffa726',
    gradientStart: '#ff8a50',
    gradientEnd: '#ff6b35',
    messageUserBg: '#ff8f50',
    messageAssistantBg: '#ffe5b4',
    borderColor: '#ff9966',
    shadowColor: 'rgba(255, 107, 53, 0.3)',
    icon: '🗺️'
  },

  mystery: {
    id: 'mystery',
    name: 'Mystery',
    primaryColor: '#4a148c',
    secondaryColor: '#7b1fa2',
    backgroundColor: '#f3e5f5',
    textColor: '#1a0033',
    accentColor: '#9c27b0',
    gradientStart: '#6a1b9a',
    gradientEnd: '#4a148c',
    messageUserBg: '#8e24aa',
    messageAssistantBg: '#e1bee7',
    borderColor: '#9c27b0',
    shadowColor: 'rgba(74, 20, 140, 0.3)',
    icon: '🔍'
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    primaryColor: '#1976d2',
    secondaryColor: '#42a5f5',
    backgroundColor: '#e3f2fd',
    textColor: '#0d47a1',
    accentColor: '#64b5f6',
    gradientStart: '#2196f3',
    gradientEnd: '#1976d2',
    messageUserBg: '#42a5f5',
    messageAssistantBg: '#bbdefb',
    borderColor: '#64b5f6',
    shadowColor: 'rgba(25, 118, 210, 0.3)',
    icon: '💼'
  },

  playful: {
    id: 'playful',
    name: 'Playful',
    primaryColor: '#f50057',
    secondaryColor: '#ff4081',
    backgroundColor: '#fce4ec',
    textColor: '#880e4f',
    accentColor: '#ff80ab',
    gradientStart: '#ff1744',
    gradientEnd: '#f50057',
    messageUserBg: '#ff4081',
    messageAssistantBg: '#f8bbd0',
    borderColor: '#ff80ab',
    shadowColor: 'rgba(245, 0, 87, 0.3)',
    icon: '🎉'
  },

  calm: {
    id: 'calm',
    name: 'Calm',
    primaryColor: '#26a69a',
    secondaryColor: '#4db6ac',
    backgroundColor: '#e0f2f1',
    textColor: '#004d40',
    accentColor: '#80cbc4',
    gradientStart: '#26a69a',
    gradientEnd: '#00897b',
    messageUserBg: '#4db6ac',
    messageAssistantBg: '#b2dfdb',
    borderColor: '#80cbc4',
    shadowColor: 'rgba(38, 166, 154, 0.3)',
    icon: '🌊'
  },

  energetic: {
    id: 'energetic',
    name: 'Energetic',
    primaryColor: '#ffea00',
    secondaryColor: '#ffd600',
    backgroundColor: '#fffde7',
    textColor: '#f57f17',
    accentColor: '#ffee58',
    gradientStart: '#ffd600',
    gradientEnd: '#ffab00',
    messageUserBg: '#ffeb3b',
    messageAssistantBg: '#fff9c4',
    borderColor: '#ffee58',
    shadowColor: 'rgba(255, 234, 0, 0.4)',
    icon: '⚡'
  },

  melancholic: {
    id: 'melancholic',
    name: 'Melancholic',
    primaryColor: '#546e7a',
    secondaryColor: '#78909c',
    backgroundColor: '#eceff1',
    textColor: '#263238',
    accentColor: '#90a4ae',
    gradientStart: '#607d8b',
    gradientEnd: '#546e7a',
    messageUserBg: '#78909c',
    messageAssistantBg: '#cfd8dc',
    borderColor: '#90a4ae',
    shadowColor: 'rgba(84, 110, 122, 0.3)',
    icon: '🌧️'
  },

  inspiring: {
    id: 'inspiring',
    name: 'Inspiring',
    primaryColor: '#00bfa5',
    secondaryColor: '#1de9b6',
    backgroundColor: '#e0f7fa',
    textColor: '#006064',
    accentColor: '#64ffda',
    gradientStart: '#1de9b6',
    gradientEnd: '#00bfa5',
    messageUserBg: '#26c6da',
    messageAssistantBg: '#b2ebf2',
    borderColor: '#64ffda',
    shadowColor: 'rgba(0, 191, 165, 0.3)',
    icon: '✨'
  },

  cozy: {
    id: 'cozy',
    name: 'Cozy',
    primaryColor: '#795548',
    secondaryColor: '#a1887f',
    backgroundColor: '#efebe9',
    textColor: '#3e2723',
    accentColor: '#bcaaa4',
    gradientStart: '#8d6e63',
    gradientEnd: '#795548',
    messageUserBg: '#a1887f',
    messageAssistantBg: '#d7ccc8',
    borderColor: '#bcaaa4',
    shadowColor: 'rgba(121, 85, 72, 0.3)',
    icon: '🏠'
  },

  dramatic: {
    id: 'dramatic',
    name: 'Dramatic',
    primaryColor: '#d32f2f',
    secondaryColor: '#f44336',
    backgroundColor: '#ffebee',
    textColor: '#b71c1c',
    accentColor: '#ef5350',
    gradientStart: '#e53935',
    gradientEnd: '#d32f2f',
    messageUserBg: '#f44336',
    messageAssistantBg: '#ffcdd2',
    borderColor: '#ef5350',
    shadowColor: 'rgba(211, 47, 47, 0.3)',
    icon: '🎭'
  },

  fantasy: {
    id: 'fantasy',
    name: 'Fantasy',
    primaryColor: '#673ab7',
    secondaryColor: '#9575cd',
    backgroundColor: '#ede7f6',
    textColor: '#311b92',
    accentColor: '#b39ddb',
    gradientStart: '#7e57c2',
    gradientEnd: '#673ab7',
    messageUserBg: '#9575cd',
    messageAssistantBg: '#d1c4e9',
    borderColor: '#b39ddb',
    shadowColor: 'rgba(103, 58, 183, 0.3)',
    icon: '🔮'
  }
};

// Default theme for initial load
export const defaultTheme: Theme = themes.calm;

// Get theme by ID or return default
export const getTheme = (themeId: string): Theme => {
  return themes[themeId] || defaultTheme;
};

// Get theme from dynamic theme object or static theme ID
export const getThemeFromData = (themeData: Theme | string | null | undefined): Theme => {
  if (!themeData) {
    return defaultTheme;
  }

  // If it's already a Theme object, return it
  if (typeof themeData === 'object' && 'primaryColor' in themeData) {
    return themeData as Theme;
  }

  // If it's a string ID, look it up
  if (typeof themeData === 'string') {
    return getTheme(themeData);
  }

  return defaultTheme;
};
