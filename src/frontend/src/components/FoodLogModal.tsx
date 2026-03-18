import { Camera, Loader2, PenLine, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Profile } from "../backend";
import { RecommendationTag } from "../backend";
import { useActor } from "../hooks/useActor";
import FullscreenCamera from "./FullscreenCamera";

interface NutritionData {
  foodName?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
  salt?: number;
  cholesterol?: number;
  servingSize?: string;
}

function calcRecommendation(
  data: NutritionData,
  avoidances: string[],
): RecommendationTag {
  const lower = avoidances.map((a) => a.toLowerCase());
  let score = 0;
  if (lower.includes("sugar") && (data.sugar ?? 0) > 10) score++;
  if (lower.includes("salt") && (data.salt ?? 0) > 500) score++;
  if (lower.includes("sodium") && (data.salt ?? 0) > 500) score++;
  if (lower.includes("cholesterol") && (data.cholesterol ?? 0) > 100) score++;
  if (lower.includes("saturated fat") && (data.fat ?? 0) > 10) score++;
  if (score === 0) return RecommendationTag.recommended;
  if (score === 1) return RecommendationTag.okay;
  return RecommendationTag.notRecommended;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onFoodAdded: () => void;
  onSearching?: (photoUrl: string) => void;
}

export default function FoodLogModal({
  isOpen,
  onClose,
  profile,
  onFoodAdded,
  onSearching,
}: Props) {
  const { actor: backend } = useActor();
  const [tab, setTab] = useState<"camera" | "manual">("camera");

  // Camera tab state
  const [showFullscreenCamera, setShowFullscreenCamera] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [foodNameQuery, setFoodNameQuery] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);

  // Manual tab state
  const [manualName, setManualName] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [manualServing, setManualServing] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");
  const [manualSugar, setManualSugar] = useState("");
  const [manualSalt, setManualSalt] = useState("");
  const [manualCholesterol, setManualCholesterol] = useState("");
  const [addingManual, setAddingManual] = useState(false);

  // Clean up on close
  useEffect(() => {
    if (!isOpen) {
      setPhotoTaken(false);
      setPhotoUrl(null);
      setNutrition(null);
      setFoodNameQuery("");
      setShowFullscreenCamera(false);
    }
  }, [isOpen]);

  const handleCameraCapture = (dataUrl: string) => {
    setPhotoUrl(dataUrl);
    setPhotoTaken(true);
    setShowFullscreenCamera(false);
  };

  const analyzeFood = async () => {
    if (!backend || !foodNameQuery.trim()) return;
    setAnalyzing(true);
    // Notify parent that we're searching (pass photoUrl or empty string)
    if (onSearching && photoUrl) {
      onSearching(photoUrl);
    }
    onClose();
    try {
      const response = await backend.analyzeFood(foodNameQuery);
      const parsed = JSON.parse(response) as NutritionData;
      setNutrition(parsed);
      // Log the food immediately after analysis
      const avoidances = profile?.ingredientAvoidances ?? [];
      const tag = calcRecommendation(parsed, avoidances);
      await backend.addFoodLogEntry({
        foodName: parsed.foodName ?? foodNameQuery,
        calories: BigInt(Math.round(parsed.calories ?? 0)),
        servingSize: parsed.servingSize ?? "1 serving",
        macros: {
          protein: parsed.protein ?? 0,
          carbs: parsed.carbs ?? 0,
          fat: parsed.fat ?? 0,
          sugar: parsed.sugar ?? 0,
          salt: parsed.salt ?? 0,
          cholesterol: parsed.cholesterol ?? 0,
        },
        loggedTimestamp: BigInt(Date.now()) * BigInt(1_000_000),
        recommendationTag: tag,
      });
      toast.success("Food logged!");
      onFoodAdded();
    } catch {
      toast.error("Could not analyze food. Please try again.");
      onFoodAdded(); // still clear pending
    } finally {
      setAnalyzing(false);
    }
  };

  const logCameraFood = async () => {
    if (!backend || !nutrition) return;
    const avoidances = profile?.ingredientAvoidances ?? [];
    const tag = calcRecommendation(nutrition, avoidances);
    try {
      await backend.addFoodLogEntry({
        foodName: nutrition.foodName ?? foodNameQuery,
        calories: BigInt(Math.round(nutrition.calories ?? 0)),
        servingSize: nutrition.servingSize ?? "1 serving",
        macros: {
          protein: nutrition.protein ?? 0,
          carbs: nutrition.carbs ?? 0,
          fat: nutrition.fat ?? 0,
          sugar: nutrition.sugar ?? 0,
          salt: nutrition.salt ?? 0,
          cholesterol: nutrition.cholesterol ?? 0,
        },
        loggedTimestamp: BigInt(Date.now()) * BigInt(1_000_000),
        recommendationTag: tag,
      });
      toast.success("Food logged!");
      onFoodAdded();
    } catch {
      toast.error("Failed to log food");
    }
  };

  const logManualFood = async () => {
    if (!backend || !manualName || !manualCalories) return;
    setAddingManual(true);
    const avoidances = profile?.ingredientAvoidances ?? [];
    const nd: NutritionData = {
      calories: Number.parseFloat(manualCalories),
      sugar: Number.parseFloat(manualSugar) || 0,
      salt: Number.parseFloat(manualSalt) || 0,
      cholesterol: Number.parseFloat(manualCholesterol) || 0,
      fat: Number.parseFloat(manualFat) || 0,
    };
    const tag = calcRecommendation(nd, avoidances);
    try {
      await backend.addFoodLogEntry({
        foodName: manualName,
        calories: BigInt(Math.round(Number.parseFloat(manualCalories))),
        servingSize: manualServing || "1 serving",
        macros: {
          protein: Number.parseFloat(manualProtein) || 0,
          carbs: Number.parseFloat(manualCarbs) || 0,
          fat: Number.parseFloat(manualFat) || 0,
          sugar: Number.parseFloat(manualSugar) || 0,
          salt: Number.parseFloat(manualSalt) || 0,
          cholesterol: Number.parseFloat(manualCholesterol) || 0,
        },
        loggedTimestamp: BigInt(Date.now()) * BigInt(1_000_000),
        recommendationTag: tag,
      });
      toast.success("Food logged!");
      onFoodAdded();
    } catch {
      toast.error("Failed to log food");
    } finally {
      setAddingManual(false);
    }
  };

  if (!isOpen) return null;

  const inputClass =
    "w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple text-base";

  const recBadge = nutrition
    ? (() => {
        const tag = calcRecommendation(
          nutrition,
          profile?.ingredientAvoidances ?? [],
        );
        const map = {
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
        return map[tag];
      })()
    : null;

  const manualFields = [
    {
      id: "manual-sugar",
      label: "Sugar (g)",
      val: manualSugar,
      set: setManualSugar,
    },
    {
      id: "manual-salt",
      label: "Salt (mg)",
      val: manualSalt,
      set: setManualSalt,
    },
    {
      id: "manual-cholesterol",
      label: "Cholesterol (mg)",
      val: manualCholesterol,
      set: setManualCholesterol,
    },
    {
      id: "manual-protein",
      label: "Protein (g)",
      val: manualProtein,
      set: setManualProtein,
    },
    { id: "manual-fat", label: "Fat (g)", val: manualFat, set: setManualFat },
    {
      id: "manual-carbs",
      label: "Carbs (g)",
      val: manualCarbs,
      set: setManualCarbs,
    },
  ];

  return (
    <>
      {showFullscreenCamera && (
        <FullscreenCamera
          onCapture={handleCameraCapture}
          onClose={() => setShowFullscreenCamera(false)}
        />
      )}

      <div
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: "rgba(0,0,0,0.6)" }}
      >
        <div
          data-ocid="food.modal"
          className="w-full max-w-[480px] rounded-t-3xl flex flex-col max-h-[90vh] animate-slide-up"
          style={{ background: "oklch(var(--card))" }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <h2 className="text-lg font-bold gradient-text">Log Food</h2>
            <button
              type="button"
              data-ocid="food.close_button"
              onClick={onClose}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mx-5 mb-4 gap-1 p-1 rounded-xl bg-secondary">
            <button
              type="button"
              data-ocid="food.tab"
              onClick={() => setTab("camera")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "camera" ? "text-white" : "text-muted-foreground"
              }`}
              style={
                tab === "camera"
                  ? { background: "linear-gradient(135deg, #8B5CF6, #22C1C3)" }
                  : {}
              }
            >
              <Camera className="w-4 h-4" /> Camera
            </button>
            <button
              type="button"
              data-ocid="food.tab"
              onClick={() => setTab("manual")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "manual" ? "text-white" : "text-muted-foreground"
              }`}
              style={
                tab === "manual"
                  ? { background: "linear-gradient(135deg, #8B5CF6, #22C1C3)" }
                  : {}
              }
            >
              <PenLine className="w-4 h-4" /> Manual
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            {tab === "camera" ? (
              <div className="flex flex-col gap-4">
                {/* Photo preview or placeholder */}
                {!photoUrl ? (
                  <div
                    className="relative w-full rounded-2xl overflow-hidden bg-secondary flex flex-col items-center justify-center gap-3"
                    style={{ aspectRatio: "4/3" }}
                  >
                    <Camera className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Camera preview
                    </p>
                    <button
                      type="button"
                      data-ocid="food.upload_button"
                      onClick={() => setShowFullscreenCamera(true)}
                      className="px-4 py-2 rounded-full text-white text-sm font-medium"
                      style={{
                        background: "linear-gradient(135deg, #8B5CF6, #22C1C3)",
                      }}
                    >
                      Start Camera
                    </button>
                  </div>
                ) : (
                  <div
                    className="relative w-full rounded-2xl overflow-hidden"
                    style={{ aspectRatio: "4/3" }}
                  >
                    <img
                      src={photoUrl}
                      alt="Captured food"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl(null);
                        setPhotoTaken(false);
                        setNutrition(null);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {photoTaken && !nutrition && (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                      What food is this?
                    </p>
                    <input
                      id="food-name-query"
                      data-ocid="food.input"
                      className={inputClass}
                      placeholder="e.g. Grilled chicken breast"
                      value={foodNameQuery}
                      onChange={(e) => setFoodNameQuery(e.target.value)}
                    />
                    <button
                      type="button"
                      data-ocid="food.secondary_button"
                      onClick={analyzeFood}
                      disabled={analyzing || !foodNameQuery.trim()}
                      className="w-full h-12 rounded-full text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{
                        background: "linear-gradient(135deg, #8B5CF6, #22C1C3)",
                      }}
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Analyzing...
                        </>
                      ) : (
                        "🔍 Analyze"
                      )}
                    </button>
                  </div>
                )}

                {nutrition && (
                  <div className="card-dark p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">
                        {nutrition.foodName ?? foodNameQuery}
                      </h3>
                      {recBadge && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            color: recBadge.color,
                            backgroundColor: recBadge.bg,
                          }}
                        >
                          {recBadge.label}
                        </span>
                      )}
                    </div>
                    <div className="text-3xl font-bold gradient-text">
                      {nutrition.calories ?? 0}{" "}
                      <span className="text-lg text-muted-foreground font-normal">
                        cal
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          label: "Protein",
                          val: nutrition.protein,
                          unit: "g",
                          color: "#8B5CF6",
                        },
                        {
                          label: "Carbs",
                          val: nutrition.carbs,
                          unit: "g",
                          color: "#22C1C3",
                        },
                        {
                          label: "Fat",
                          val: nutrition.fat,
                          unit: "g",
                          color: "#f59e0b",
                        },
                        {
                          label: "Sugar",
                          val: nutrition.sugar,
                          unit: "g",
                          color: "#ef4444",
                        },
                        {
                          label: "Salt",
                          val: nutrition.salt,
                          unit: "mg",
                          color: "#6b7280",
                        },
                        {
                          label: "Cholesterol",
                          val: nutrition.cholesterol,
                          unit: "mg",
                          color: "#ec4899",
                        },
                      ].map((m) => (
                        <div
                          key={m.label}
                          className="bg-secondary rounded-xl p-2 text-center"
                        >
                          <div
                            className="font-semibold text-sm"
                            style={{ color: m.color }}
                          >
                            {m.val ?? 0}
                            {m.unit}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {m.label}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      data-ocid="food.submit_button"
                      onClick={logCameraFood}
                      className="w-full h-12 rounded-full text-white font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #8B5CF6, #22C1C3)",
                      }}
                    >
                      Log This Food ✓
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="manual-food-name"
                    className="text-sm text-muted-foreground"
                  >
                    Food Name *
                  </label>
                  <input
                    id="manual-food-name"
                    data-ocid="food.input"
                    className={inputClass}
                    placeholder="e.g. Grilled Chicken"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-2">
                    <label
                      htmlFor="manual-cal"
                      className="text-sm text-muted-foreground"
                    >
                      Calories *
                    </label>
                    <input
                      id="manual-cal"
                      type="number"
                      className={inputClass}
                      placeholder="300"
                      value={manualCalories}
                      onChange={(e) => setManualCalories(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <label
                      htmlFor="manual-serving"
                      className="text-sm text-muted-foreground"
                    >
                      Serving Size
                    </label>
                    <input
                      id="manual-serving"
                      className={inputClass}
                      placeholder="1 cup"
                      value={manualServing}
                      onChange={(e) => setManualServing(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {manualFields.map((f) => (
                    <div key={f.id} className="flex flex-col gap-1">
                      <label
                        htmlFor={f.id}
                        className="text-xs text-muted-foreground"
                      >
                        {f.label}
                      </label>
                      <input
                        id={f.id}
                        type="number"
                        className={`${inputClass} py-2 text-sm`}
                        placeholder="0"
                        value={f.val}
                        onChange={(e) => f.set(e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  data-ocid="food.submit_button"
                  onClick={logManualFood}
                  disabled={addingManual || !manualName || !manualCalories}
                  className="w-full h-14 rounded-full text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  style={{
                    background: "linear-gradient(135deg, #8B5CF6, #22C1C3)",
                  }}
                >
                  {addingManual ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                    </>
                  ) : (
                    "Add Food ✓"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
