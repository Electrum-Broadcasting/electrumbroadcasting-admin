"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

type ContributorRow = {
  id: string;
  display_name: string | null;
  fraud_score: number | null;
  fraud_level: string | null;
  locked: boolean;
};

interface ContributorsPanelProps {
  contributors: ContributorRow[];
  selectedContributorId: string;
  onSelectContributor: (id: string) => void;

  setIsContributorDrawerOpen: (open: boolean) => void;

  fraudScore: string;
  onFraudScoreChange: (value: string) => void;

  fraudLevel: string;
  onFraudLevelChange: (value: string) => void;

  onLock: () => void;
  onUnlock: () => void;
  onSetFraudScore: () => void;
  onSetFraudLevel: () => void;
}

export function ContributorsPanel({
  contributors,
  selectedContributorId,
  onSelectContributor,

  setIsContributorDrawerOpen,

  fraudScore,
  onFraudScoreChange,

  fraudLevel,
  onFraudLevelChange,

  onLock,
  onUnlock,
  onSetFraudScore,
  onSetFraudLevel,
}: ContributorsPanelProps) {
  const selectedContributor = Array.isArray(contributors)
    ? contributors.find((c) => c.id === selectedContributorId)
    : null;

  return (
    <section className="border rounded-lg p-6 space-y-4 relative overflow-visible">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Contributors</h2>
      </div>

      <div className="flex flex-col gap-6">
        {/* Row 1: Dropdown */}
        <div className="flex items-center gap-3">
          <Select
            value={selectedContributorId}
            onValueChange={onSelectContributor}
          >
            <SelectTrigger className="min-w-[560px] max-w-[960px]">
              <SelectValue placeholder="Select contributor" />
            </SelectTrigger>

            <SelectContent>
              {Array.isArray(contributors)
                ? contributors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span>{c.display_name ?? c.id}</span>

                        {c.locked ? (
                          <StatusBadge color="blue">Frozen</StatusBadge>
                        ) : (
                          <StatusBadge color="gray">Active</StatusBadge>
                        )}

                        {c.fraud_level && (
                          <StatusBadge
                            color={
                              c.fraud_level === "high"
                                ? "red"
                                : c.fraud_level === "medium"
                                ? "yellow"
                                : "green"
                            }
                          >
                            {c.fraud_level}
                          </StatusBadge>
                        )}

                        {typeof c.fraud_score === "number" && (
                          <span className="text-xs text-muted-foreground">
                            score: {c.fraud_score}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                : null}
            </SelectContent>
          </Select>

          {selectedContributorId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsContributorDrawerOpen(true)}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
          )}
        </div>

        {/* Row 2: Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onLock}
            disabled={!selectedContributor || selectedContributor.locked}
          >
            Lock
          </Button>

          <Button
            onClick={onUnlock}
            disabled={!selectedContributor || !selectedContributor.locked}
          >
            Unlock
          </Button>

          <Input
            type="number"
            placeholder="Fraud score"
            value={fraudScore}
            onChange={(e) => onFraudScoreChange(e.target.value)}
            className="w-32"
          />

          <Button onClick={onSetFraudScore} disabled={!selectedContributor}>
            Set score
          </Button>

          <Select value={fraudLevel} onValueChange={onFraudLevelChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Fraud level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={onSetFraudLevel} disabled={!selectedContributor}>
            Set level
          </Button>
        </div>
      </div>
    </section>
  );
}
