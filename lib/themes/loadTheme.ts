import defaultTheme from "@/themes/default.json";

type ThemeObject = Record<string, unknown>;

function isThemeObject(value: unknown): value is ThemeObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeTheme(defaults: ThemeObject, overrides: ThemeObject): ThemeObject {
  const result: ThemeObject = { ...defaults };
  for (const [key, value] of Object.entries(overrides)) {
    const defaultValue = defaults[key];
    result[key] =
      isThemeObject(defaultValue) && isThemeObject(value)
        ? mergeTheme(defaultValue, value)
        : value;
  }
  return result;
}

export function loadMergedTheme(theme: unknown, baseTheme: unknown = defaultTheme): ThemeObject {
  const defaults = isThemeObject(baseTheme)
    ? mergeTheme(defaultTheme as ThemeObject, baseTheme)
    : (defaultTheme as ThemeObject);
  return mergeTheme(defaults, isThemeObject(theme) ? theme : {});
}
