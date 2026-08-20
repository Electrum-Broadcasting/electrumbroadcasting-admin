"use client";

import type { Dispatch, SetStateAction } from "react";

type BrandSocialState = {
  social_youtube?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_bluesky?: string;
};

type BrandSocialFieldsProps = {
  state: BrandSocialState;
  setState: Dispatch<SetStateAction<BrandSocialState>>;
};

export function BrandSocialFields({ state, setState }: BrandSocialFieldsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Social Links</h2>

      <input
        type="text"
        placeholder="YouTube URL"
        value={state.social_youtube || ""}
        onChange={(e) => setState({ ...state, social_youtube: e.target.value })}
        className="input"
      />

      <input
        type="text"
        placeholder="Facebook URL"
        value={state.social_facebook || ""}
        onChange={(e) => setState({ ...state, social_facebook: e.target.value })}
        className="input"
      />

      <input
        type="text"
        placeholder="Instagram URL"
        value={state.social_instagram || ""}
        onChange={(e) => setState({ ...state, social_instagram: e.target.value })}
        className="input"
      />

      <input
        type="text"
        placeholder="Bluesky URL"
        value={state.social_bluesky || ""}
        onChange={(e) => setState({ ...state, social_bluesky: e.target.value })}
        className="input"
      />
    </div>
  );
}
