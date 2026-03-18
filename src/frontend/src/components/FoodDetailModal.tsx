import { X } from "lucide-react";
import type { FoodLogEntry } from "../backend";
import { RecommendationTag } from "../backend";

interface Props {
  entry: FoodLogEntry | null;
  onClose: () => void;
}

function formatTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const REC_CONFIG = {
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

export default function FoodDetailModal({ entry, onClose }: Props) {
  if (!entry) return null;

  const rec = REC_CONFIG[entry.recommendationTag];

  const macros = [
    {
      label: "Protein",
      value: entry.macros.protein,
      unit: "g",
      color: "#8B5CF6",
    },
    { label: "Carbs", value: entry.macros.carbs, unit: "g", color: "#22C1C3" },
    { label: "Fat", value: entry.macros.fat, unit: "g", color: "#f59e0b" },
    { label: "Sugar", value: entry.macros.sugar, unit: "g", color: "#ef4444" },
    { label: "Salt", value: entry.macros.salt, unit: "mg", color: "#6b7280" },
    {
      label: "Cholesterol",
      value: entry.macros.cholesterol,
      unit: "mg",
      color: "#ec4899",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
    >
      {/* Backdrop close */}
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
      />

      <div
        data-ocid="food_detail.modal"
        className="relative w-full max-w-[480px] rounded-t-3xl flex flex-col max-h-[85vh] animate-slide-up"
        style={{ background: "oklch(var(--card))" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-3">
          <div className="flex-1 pr-3">
            <h2 className="text-xl font-bold text-foreground leading-tight">
              {entry.foodName}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Logged at {formatTime(entry.loggedTimestamp)}
            </p>
          </div>
          <button
            type="button"
            data-ocid="food_detail.close_button"
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {/* Rec badge */}
          <div className="flex items-center gap-3 mb-5">
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ color: rec.color, backgroundColor: rec.bg }}
            >
              {rec.label}
            </span>
          </div>

          {/* Big calories */}
          <div
            className="card-dark p-5 flex flex-col items-center rounded-2xl mb-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,193,195,0.15))",
            }}
          >
            <span className="text-5xl font-bold gradient-text">
              {Number(entry.calories)}
            </span>
            <span className="text-muted-foreground text-sm mt-1">calories</span>
            {entry.servingSize && (
              <span className="text-xs text-muted-foreground mt-2">
                Serving: {entry.servingSize}
              </span>
            )}
          </div>

          {/* Macros grid */}
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Nutrition Details
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {macros.map((m) => (
              <div
                key={m.label}
                className="card-dark p-3 rounded-xl flex flex-col items-center gap-1"
              >
                <span className="text-lg font-bold" style={{ color: m.color }}>
                  {Math.round(m.value * 10) / 10}
                  {m.unit}
                </span>
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
