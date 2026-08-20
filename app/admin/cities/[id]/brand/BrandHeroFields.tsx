"use client";

import type { Dispatch, SetStateAction } from "react";

type BrandHeroFieldsState = {
  hero_title?: string;
  hero_subtitle?: string;
  hero_cta_text?: string;
  hero_cta_link?: string;
  [key: string]: unknown;
};

type BrandHeroFieldsProps = {
  state: BrandHeroFieldsState;
  setState: Dispatch<SetStateAction<BrandHeroFieldsState>>;
};

export function BrandHeroFields({ state, setState }: BrandHeroFieldsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Hero Section</h2>

      <input
        type="text"
        placeholder="Hero Title"
        value={state.hero_title || ""}
        onChange={(e) => setState({ ...state, hero_title: e.target.value })}
        className="input"
      />

      <input
        type="text"
        placeholder="Hero Subtitle"
        value={state.hero_subtitle || ""}
        onChange={(e) => setState({ ...state, hero_subtitle: e.target.value })}
        className="input"
      />

      <input
        type="text"
        placeholder="CTA Text"
        value={state.hero_cta_text || ""}
        onChange={(e) => setState({ ...state, hero_cta_text: e.target.value })}
        className="input"
      />

      <input
        type="text"
        placeholder="CTA Link"
        value={state.hero_cta_link || ""}
        onChange={(e) => setState({ ...state, hero_cta_link: e.target.value })}
        className="input"
      />
    </div>
  );
}
