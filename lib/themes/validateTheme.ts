const MAX_THEME_SIZE = 100_000;
const MAX_DEPTH = 12;
const UNSAFE_VALUE = /url\s*\(|expression\s*\(|javascript\s*:|<\/(?:style|script)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function validateTheme(value: unknown): string | null {
  if (!isRecord(value)) return "Theme must be a JSON object.";

  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return "Theme must be valid JSON.";
  }
  if (serialized.length > MAX_THEME_SIZE) {
    return "Theme exceeds the 100 KB size limit.";
  }

  function visit(current: unknown, path: string[], depth: number): string | null {
    if (depth > MAX_DEPTH) return `${path.join(".") || "Theme"} is nested too deeply.`;
    if (typeof current === "string") {
      if (current.length > 2_000) {
        return `${path.join(".")} exceeds the string size limit.`;
      }
      if (UNSAFE_VALUE.test(current)) {
        return `${path.join(".")} contains an unsupported CSS or script value.`;
      }
      return null;
    }
    if (typeof current === "number") {
      return Number.isFinite(current)
        ? null
        : `${path.join(".")} must be a finite number.`;
    }
    if (
      current === null ||
      typeof current === "boolean"
    ) {
      return null;
    }
    if (Array.isArray(current)) {
      if (current.length > 1_000) {
        return `${path.join(".")} contains too many entries.`;
      }
      for (let index = 0; index < current.length; index += 1) {
        const error = visit(current[index], [...path, String(index)], depth + 1);
        if (error) return error;
      }
      return null;
    }
    if (!isRecord(current)) {
      return `${path.join(".") || "Theme"} contains an unsupported value.`;
    }
    for (const [key, child] of Object.entries(current)) {
      if (
        !/^[a-zA-Z0-9_-]+$/.test(key) ||
        key === "__proto__" ||
        key === "prototype" ||
        key === "constructor"
      ) {
        return `${path.join(".") || "Theme"} contains an unsupported key.`;
      }
      const error = visit(child, [...path, key], depth + 1);
      if (error) return error;
    }
    return null;
  }

  return visit(value, [], 0);
}
