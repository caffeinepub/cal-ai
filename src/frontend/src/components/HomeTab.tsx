import { Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FoodLogEntry, Profile } from "../backend";
import { RecommendationTag } from "../backend";
import { useActor } from "../hooks/useActor";
import FoodDetailModal from "./FoodDetailModal";
import FoodLogModal from "./FoodLogModal";

interface Props {
  profile: Profile;
}

function formatTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RecommendationBadge({ tag }: { tag: RecommendationTag }) {
  const config = {
    [RecommendationTag.recommended]: {
      label: "Recommended",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.15)",
    },
    [RecommendationTag.okay]: {
      label: "Okay",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.15)",
    },
    [RecommendationTag.notRecommended]: {
      label: "Not Recommended",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.15)",
    },
  };
  const c = config[tag];
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {c.label}
    </span>
  );
}

function CalorieRing({
  consumed,
  target,
}: { consumed: number; target: number }) {
  const [progress, setProgress] = useState(0);
  const pct = Math.min(consumed / Math.max(target, 1), 1);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => setProgress(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  const remaining = Math.max(target - consumed, 0);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-48 h-48">
        <svg
          width="192"
          height="192"
          className="-rotate-90"
          role="img"
          aria-label={`Calorie progress: ${consumed} of ${target} calories consumed`}
        >
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#22C1C3" />
            </linearGradient>
          </defs>
          <circle
            cx="96"
            cy="96"
            r={radius}
            fill="none"
            stroke="oklch(var(--secondary))"
            strokeWidth="14"
          />
          <circle
            cx="96"
            cy="96"
            r={radius}
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress * circumference}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">
            {remaining.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">
            / {target.toLocaleString()} cal
          </span>
          <span className="text-xs text-muted-foreground">remaining</span>
        </div>
      </div>
      <div className="flex gap-4 text-sm">
        <span className="text-muted-foreground">
          Consumed:{" "}
          <span className="text-foreground font-medium">
            {consumed.toLocaleString()}
          </span>
        </span>
        <span className="text-muted-foreground">
          Target:{" "}
          <span className="text-foreground font-medium">
            {target.toLocaleString()}
          </span>
        </span>
      </div>
    </div>
  );
}

export default function HomeTab({ profile }: Props) {
  const { actor: backend } = useActor();
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingEntry, setPendingEntry] = useState<{
    photoUrl: string;
    label: string;
  } | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<FoodLogEntry | null>(null);

  const loadData = useCallback(async () => {
    if (!backend) return;
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 86400000);
    const startNs = BigInt(startOfDay.getTime()) * BigInt(1_000_000);
    const endNs = BigInt(endOfDay.getTime()) * BigInt(1_000_000);

    try {
      const [fetchedLogs, totalCal] = await Promise.all([
        backend.getFoodLogsByDateRange(startNs, endNs),
        backend.getTotalCaloriesToday(),
      ]);
      setLogs(fetchedLogs);
      setTotalCalories(Number(totalCal));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [backend]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (ts: bigint) => {
    if (!backend) return;
    try {
      await backend.deleteFoodLogEntry(ts);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearching = (photoUrl: string) => {
    setPendingEntry({ photoUrl, label: "Searching for ingredients..." });
    setModalOpen(false);
  };

  const target = Number(profile.dailyCalorieTarget);

  const totalMacros = logs.reduce(
    (acc, log) => ({
      protein: acc.protein + log.macros.protein,
      carbs: acc.carbs + log.macros.carbs,
      fat: acc.fat + log.macros.fat,
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Cal AI</h1>
          <p className="text-muted-foreground text-sm">
            {greeting()}, {profile.firstName}! 👋
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #22C1C3)" }}
        >
          <span className="text-white font-bold text-sm">
            {profile.firstName?.[0]}
            {profile.lastName?.[0]}
          </span>
        </div>
      </header>

      <div className="px-5 flex flex-col gap-5">
        {/* Calorie Ring */}
        <div className="card-dark p-5 flex flex-col items-center">
          {loading ? (
            <div
              data-ocid="home.loading_state"
              className="w-48 h-48 flex items-center justify-center"
            >
              <div className="w-10 h-10 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
            </div>
          ) : (
            <CalorieRing consumed={totalCalories} target={target} />
          )}
        </div>

        {/* Macro pills */}
        <div className="flex gap-2">
          {[
            { label: "Protein", value: totalMacros.protein, color: "#8B5CF6" },
            { label: "Carbs", value: totalMacros.carbs, color: "#22C1C3" },
            { label: "Fat", value: totalMacros.fat, color: "#f59e0b" },
          ].map((m) => (
            <div
              key={m.label}
              className="flex-1 card-dark p-3 flex flex-col items-center gap-1"
            >
              <span className="text-lg font-bold" style={{ color: m.color }}>
                {Math.round(m.value)}g
              </span>
              <span className="text-xs text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>

        {/* Food Log */}
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">
            Today&apos;s Food Log
          </h2>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-dark p-4 h-16 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Pending entry */}
              {pendingEntry && (
                <div
                  data-ocid="food.loading_state"
                  className="card-dark p-4 flex items-center gap-3 animate-pulse"
                >
                  <img
                    src={pendingEntry.photoUrl}
                    alt="Pending food"
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Searching for ingredients
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Loader2 className="w-3 h-3 animate-spin text-brand-purple" />
                      <span className="text-xs text-muted-foreground">
                        Analyzing nutrition...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {logs.length === 0 && !pendingEntry ? (
                <div
                  data-ocid="home.empty_state"
                  className="card-dark p-8 flex flex-col items-center gap-2 text-center"
                >
                  <span className="text-4xl">🍽️</span>
                  <p className="text-muted-foreground text-sm">
                    No food logged today. Tap the button below to add your first
                    meal!
                  </p>
                </div>
              ) : (
                logs.map((log, i) => (
                  <button
                    key={Number(log.loggedTimestamp)}
                    type="button"
                    data-ocid={`food.item.${i + 1}`}
                    onClick={() => setSelectedEntry(log)}
                    className="card-dark p-4 flex items-center gap-3 animate-fade-in w-full text-left hover:bg-secondary/60 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,193,195,0.2))",
                      }}
                    >
                      🍴
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {log.foodName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <RecommendationBadge tag={log.recommendationTag} />
                        <span className="text-xs text-muted-foreground">
                          {formatTime(log.loggedTimestamp)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        {Number(log.calories)}
                      </span>
                      <span className="text-xs text-muted-foreground">cal</span>
                      <button
                        type="button"
                        data-ocid={`food.delete_button.${i + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(log.loggedTimestamp);
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        data-ocid="home.primary_button"
        onClick={() => setModalOpen(true)}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 h-14 px-6 rounded-full text-white font-semibold flex items-center gap-2 shadow-glow transition-all duration-200 active:scale-95 z-40"
        style={{ background: "linear-gradient(135deg, #8B5CF6, #22C1C3)" }}
      >
        <Plus className="w-5 h-5" />
        Calorie AI
      </button>

      <FoodLogModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        profile={profile}
        onFoodAdded={() => {
          setModalOpen(false);
          setPendingEntry(null);
          loadData();
        }}
        onSearching={handleSearching}
      />

      <FoodDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
}
