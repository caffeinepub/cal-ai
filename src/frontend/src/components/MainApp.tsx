import { BarChart2, Home, Settings } from "lucide-react";
import { useState } from "react";
import type { Profile } from "../backend";
import AnalyticsTab from "./AnalyticsTab";
import HomeTab from "./HomeTab";
import SettingsTab from "./SettingsTab";

interface Props {
  profile: Profile;
  onProfileUpdate: (profile: Profile) => void;
}

export default function MainApp({ profile, onProfileUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<"home" | "analytics" | "settings">(
    "home",
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <div className="w-full max-w-[480px] flex flex-col min-h-screen relative">
        <main className="flex-1 pb-24">
          {activeTab === "home" && <HomeTab profile={profile} />}
          {activeTab === "analytics" && <AnalyticsTab profile={profile} />}
          {activeTab === "settings" && (
            <SettingsTab profile={profile} onProfileUpdate={onProfileUpdate} />
          )}
        </main>

        {/* Bottom Nav */}
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] border-t border-border z-50"
          style={{ background: "oklch(var(--card))" }}
        >
          <div className="flex items-stretch h-16">
            {(
              [
                { id: "home", icon: Home, label: "Home" },
                { id: "analytics", icon: BarChart2, label: "Analytics" },
                { id: "settings", icon: Settings, label: "Settings" },
              ] as const
            ).map(({ id, icon: Icon, label }) => (
              <button
                type="button"
                key={id}
                data-ocid={`nav.${id}_link` as string}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  activeTab === id
                    ? "text-brand-purple"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
