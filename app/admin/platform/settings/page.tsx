"use client";

import SettingsLayout from "./SettingsLayout";
import SystemSettingsSection from "./sections/SystemSettingsSection";
import BrandSettingsSection from "./sections/BrandSettingsSection";
import SafetySettingsSection from "./sections/SafetySettingsSection";
import FeatureTogglesSection from "./sections/FeatureTogglesSection";
import PermissionsSettingsSection from "./sections/PermissionsSettingsSection";

export default function PlatformSettingsPage() {
  return (
    <SettingsLayout>
      {(active: string) => {
        switch (active) {
          case "system":
            return <SystemSettingsSection />;
          case "brand":
            return <BrandSettingsSection />;
          case "safety":
            return <SafetySettingsSection />;
          case "features":
            return <FeatureTogglesSection />;
          case "permissions":
            return <PermissionsSettingsSection />;
          default:
            return <SystemSettingsSection />;
        }
      }}
    </SettingsLayout>
  );
}
