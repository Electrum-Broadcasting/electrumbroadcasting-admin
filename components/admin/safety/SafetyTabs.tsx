"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToastContext } from "@/components/ui/ToastProvider";
import ModerationRulesTable from "./moderation-rules/ModerationRulesTable";

import { FlagThresholds} from "@/lib/safety/types";
import { FlagThresholdsForm } from "./FlagThresholdsForm";
import AutoActionsTab from "./AutoActionsTab";
import FraudDetectionTab from "./FraudDetectionTab";
import FraudSignalsTab from "./FraudSignalsTab";
import FraudContributorStateTab from "./FraudContributorStateTab";
import type { ModerationRule } from "./moderation-rules/ModerationRulesTable";
import AdminOverridesTab from "./AdminOverridesTab";

type SafetyTabsProps = {
  flagThresholds: FlagThresholds;
  moderationRules: ModerationRule[];
};

export function SafetyTabs({
  flagThresholds,
  moderationRules,
}: SafetyTabsProps) {
  const { showToast } = useToastContext();
  const [rules, setRules] = useState<ModerationRule[]>(moderationRules);

  async function saveModerationRules() {
  const res = await fetch("/api/admin/safety/moderation-rules/update", {
    method: "POST",
    body: JSON.stringify({ moderation_rules: rules }),
  });

  if (!res.ok) {
    showToast("Failed to save moderation rules");
    return;
  }

  // ⭐ Reload rules from the server (NOT Supabase directly)
  const refreshed = await fetch("/api/admin/safety/moderation-rules/list");
  const freshRules = await refreshed.json();

  setRules(freshRules);
  showToast("Moderation rules saved");
}

  return (
    <div className="space-y-6">
      <Tabs defaultValue="flags" className="w-full">

        {/* TABS HEADER */}
        <TabsList className="w-full justify-start">
          <TabsTrigger value="flags">Flag Thresholds</TabsTrigger>
          <TabsTrigger value="rules">Moderation Rules</TabsTrigger>
          <TabsTrigger value="actions">Auto-Actions</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
          <TabsTrigger value="fraud-signals">Fraud Signals</TabsTrigger>
          <TabsTrigger value="fraud-state">Contributor Fraud State</TabsTrigger>
            <TabsTrigger value="overrides">Admin Overrides</TabsTrigger>
        </TabsList>

        {/* FLAG THRESHOLDS */}
        <TabsContent value="flags" className="p-6 w-full max-w-3xl mx-auto">
          <div className="w-full flex justify-center">
            <FlagThresholdsForm initialValues={flagThresholds} />
          </div>
        </TabsContent>

        {/* MODERATION RULES */}
        <TabsContent value="rules" className="p-6 w-full max-w-3xl mx-auto">
          <div className="space-y-4">
            <ModerationRulesTable rules={rules} onChange={setRules} />

            <div className="flex justify-end">
              <Button onClick={saveModerationRules}>
                Save Moderation Rules
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* AUTO-ACTIONS */}
        <TabsContent value="actions" className="p-6 w-full max-w-4xl mx-auto">
            <AutoActionsTab />
        </TabsContent>

         {/* FRAUD DETECTION */}
        <TabsContent value="fraud" className="p-6 w-full max-w-4xl mx-auto  ">
            <FraudDetectionTab />
        </TabsContent>

          {/* FRAUD SIGNALS */}
          <TabsContent value="fraud-signals" className="p-6 w-full max-w-4xl mx-auto  ">
            <FraudSignalsTab />
          </TabsContent>

          {/* CONTRIBUTOR FRAUD STATE */}
          <TabsContent value="fraud-state" className="p-6 w-full max-w-4xl mx-auto  ">
            <FraudContributorStateTab />
          </TabsContent>

          {/* ADMIN OVERRIDES */}
        <TabsContent value="overrides" className="p-6 w-full max-w-3xl mx-auto">
             <AdminOverridesTab />
        </TabsContent>

      </Tabs>
    </div>
  );
}
