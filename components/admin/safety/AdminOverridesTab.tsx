"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useToastContext } from "@/components/ui/ToastProvider";

export default function AdminOverridesTab() {
  const { showToast } = useToastContext();

  // Contributor state
  const [contributorId, setContributorId] = useState("");
  const [fraudScore, setFraudScore] = useState("");
  const [fraudLevel, setFraudLevel] = useState("low");

  // Story state
  const [storyId, setStoryId] = useState("");

  async function call(route: string, body: any) {
    const res = await fetch(`/api/admin/safety/overrides/${route}`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      showToast(`Failed: ${route}`);
      return;
    }

    showToast(`Success: ${route}`);
  }

  return (
    <div className="space-y-10">

      {/* CONTRIBUTOR OVERRIDES */}
      <div className="border p-6 rounded-lg space-y-4">
        <h2 className="text-lg font-semibold">Contributor Overrides</h2>

        <Input
          placeholder="Contributor ID"
          value={contributorId}
          onChange={(e) => setContributorId(e.target.value)}
        />

        <div className="flex gap-3">
          <Button onClick={() => call("lock-contributor", { contributor_id: contributorId })}>
            Lock Contributor
          </Button>

          <Button onClick={() => call("unlock-contributor", { contributor_id: contributorId })}>
            Unlock Contributor
          </Button>
        </div>

        <div className="flex gap-3 items-center">
          <Input
            type="number"
            placeholder="Fraud Score"
            value={fraudScore}
            onChange={(e) => setFraudScore(e.target.value)}
          />
          <Button
            onClick={() =>
              call("set-fraud-score", {
                contributor_id: contributorId,
                fraud_score: Number(fraudScore),
              })
            }
          >
            Set Fraud Score
          </Button>
        </div>

        <div className="flex gap-3 items-center">
          <Select value={fraudLevel} onValueChange={setFraudLevel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Fraud Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() =>
              call("set-fraud-level", {
                contributor_id: contributorId,
                fraud_level: fraudLevel,
              })
            }
          >
            Set Fraud Level
          </Button>
        </div>
      </div>

      {/* STORY OVERRIDES */}
      <div className="border p-6 rounded-lg space-y-4">
        <h2 className="text-lg font-semibold">Story Overrides</h2>

        <Input
          placeholder="Story ID"
          value={storyId}
          onChange={(e) => setStoryId(e.target.value)}
        />

        <div className="flex gap-3">
          <Button onClick={() => call("hide-story", { story_id: storyId })}>
            Hide Story
          </Button>

          <Button onClick={() => call("unhide-story", { story_id: storyId })}>
            Unhide Story
          </Button>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => call("freeze-story", { story_id: storyId })}>
            Freeze Story
          </Button>

          <Button onClick={() => call("unfreeze-story", { story_id: storyId })}>
            Unfreeze Story
          </Button>
        </div>
      </div>
    </div>
  );
}
