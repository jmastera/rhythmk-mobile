// Race goal colors for consistent usage across the app
export const raceColors = {
  '5k': '#22c55e', // Green
  '10k': '#3b82f6', // Blue
  'half-marathon': '#8b5cf6', // Purple
  'marathon': '#ef4444', // Red
};

// Default color (app accent) if race type not found
export const defaultRaceColor = '#f97316'; // Orange

// Get color for a specific race goal type
export const getRaceColor = (raceType: string | null): string => {
  if (!raceType) return defaultRaceColor;
  return raceColors[raceType as keyof typeof raceColors] || defaultRaceColor;
};
