"use client";

import type { Dispatch, SetStateAction } from "react";

type BrandContentState = {
  description?: string;
  summary?: string;
  editorial_tone?: string;
};

type BrandContentFieldsProps = {
  state: BrandContentState;
  setState: Dispatch<SetStateAction<BrandContentState>>;
};

export function BrandContentFields({ state, setState }: BrandContentFieldsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Brand Content</h2>

      <textarea
        placeholder="Description"
        value={state.description || ""}
        onChange={(e) => setState({ ...state, description: e.target.value })}
        className="textarea"
      />

      <textarea
        placeholder="Summary"
        value={state.summary || ""}
        onChange={(e) => setState({ ...state, summary: e.target.value })}
        className="textarea"
      />

      <textarea
        placeholder="Editorial Tone"
        value={state.editorial_tone || ""}
        onChange={(e) => setState({ ...state, editorial_tone: e.target.value })}
        className="textarea"
      />
    </div>
  );
}
