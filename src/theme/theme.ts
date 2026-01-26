export const theme = {
  colors: {
    background: '#121212',
    surface: '#1E1E1E',
    primary: '#10B981', // Emerald 500
    secondary: '#3B82F6', // Blue 500
    text: '#F9FAFB', // Gray 50
    textSecondary: '#9CA3AF', // Gray 400
    error: '#EF4444', // Red 500
    success: '#10B981',
    border: '#374151', // Gray 700
    card: '#1F2937', // Gray 800
    optionBackground: '#374151',
    optionSelected: '#4B5563',
    progressBackground: '#374151',
    progressFill: '#10B981',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    round: 9999,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700', color: '#F9FAFB' },
    h2: { fontSize: 22, fontWeight: '600', color: '#F9FAFB' },
    h3: { fontSize: 18, fontWeight: '600', color: '#F9FAFB' },
    body: { fontSize: 16, color: '#D1D5DB' }, // Gray 300
    caption: { fontSize: 14, color: '#9CA3AF' },
    button: { fontSize: 16, fontWeight: '600', color: '#F9FAFB' },
  },
} as const;
