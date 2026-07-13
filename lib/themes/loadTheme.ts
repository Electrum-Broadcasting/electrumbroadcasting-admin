import defaultTheme from "@/themes/default.json";

export function loadMergedTheme(cityTheme: any) {
  return {
    colors: {
      primary: cityTheme?.colors?.primary ?? defaultTheme.colors.primary,
      secondary: cityTheme?.colors?.secondary ?? defaultTheme.colors.secondary,
      accent: cityTheme?.colors?.accent ?? defaultTheme.colors.accent,
      background: cityTheme?.colors?.background ?? defaultTheme.colors.background,
      foreground: cityTheme?.colors?.foreground ?? defaultTheme.colors.foreground,
    },
    typography: {
      heading: cityTheme?.typography?.heading ?? defaultTheme.typography.heading,
      body: cityTheme?.typography?.body ?? defaultTheme.typography.body,
    }
  };
}
