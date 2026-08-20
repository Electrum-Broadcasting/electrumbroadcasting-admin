"use client";

type BrandJsonFieldState = {
  logo?: Record<string, unknown>;
  motion?: Record<string, unknown>;
  accessibility?: Record<string, unknown>;
  child_safety?: Record<string, unknown>;
  pages?: Record<string, unknown>;
  [key: string]: unknown;
};

type BrandJsonFieldsProps = {
  state: BrandJsonFieldState;
  setState: React.Dispatch<React.SetStateAction<BrandJsonFieldState>>;
};

export function BrandJsonFields({ state, setState }: BrandJsonFieldsProps) {
  function updateJsonField(field: string, value: string) {
    try {
      const parsed = JSON.parse(value);
      setState({ ...state, [field]: parsed });
    } catch {
      // keep raw text until valid JSON
      setState({ ...state, [field]: value });
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Advanced JSON Fields</h2>

      <textarea
        placeholder="Logo JSON"
        value={JSON.stringify(state.logo || {}, null, 2)}
        onChange={(e) => updateJsonField("logo", e.target.value)}
        className="textarea h-40"
      />

      <textarea
        placeholder="Motion JSON"
        value={JSON.stringify(state.motion || {}, null, 2)}
        onChange={(e) => updateJsonField("motion", e.target.value)}
        className="textarea h-40"
      />

      <textarea
        placeholder="Accessibility JSON"
        value={JSON.stringify(state.accessibility || {}, null, 2)}
        onChange={(e) => updateJsonField("accessibility", e.target.value)}
        className="textarea h-40"
      />

      <textarea
        placeholder="Child Safety JSON"
        value={JSON.stringify(state.child_safety || {}, null, 2)}
        onChange={(e) => updateJsonField("child_safety", e.target.value)}
        className="textarea h-40"
      />

      <textarea
        placeholder="Pages JSON"
        value={JSON.stringify(state.pages || {}, null, 2)}
        onChange={(e) => updateJsonField("pages", e.target.value)}
        className="textarea h-40"
      />
    </div>
  );
}
