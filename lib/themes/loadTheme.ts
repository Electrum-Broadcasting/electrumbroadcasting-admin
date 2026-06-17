import defaultTheme from "@/themes/default.json";

export function loadMergedTheme(cityTheme: any) {
  return {
    ...defaultTheme,
    ...(cityTheme ?? {}),
    colors: {
      ...defaultTheme.colors,
      ...(cityTheme?.colors ?? {})
    },
    typography: {
      ...defaultTheme.typography,
      ...(cityTheme?.typography ?? {})
    }
  };
}
