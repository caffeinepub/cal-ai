import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Profile } from "../backend";
import { ExerciseFrequency, Goal } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const INGREDIENT_OPTIONS = [
  "Sugar",
  "Salt",
  "Cholesterol",
  "Saturated Fat",
  "Sodium",
  "Trans Fat",
  "Gluten",
  "Dairy",
];

interface Props {
  profile: Profile;
  onProfileUpdate: (profile: Profile) => void;
}

export default function SettingsTab({ profile, onProfileUpdate }: Props) {
  const { actor: backend } = useActor();
  const { clear } = useInternetIdentity();

  const [weight, setWeight] = useState(profile.weight.toString());
  const [goal, setGoal] = useState<Goal>(profile.goal);
  const [exerciseFrequency, setExerciseFrequency] = useState<ExerciseFrequency>(
    profile.exerciseFrequency,
  );
  const [avoidances, setAvoidances] = useState<string[]>(
    profile.ingredientAvoidances,
  );
  const [dailyTarget, setDailyTarget] = useState(
    Number(profile.dailyCalorieTarget).toString(),
  );
  const [saving, setSaving] = useState(false);

  const toggleAvoidance = (item: string) => {
    setAvoidances((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  const handleSave = async () => {
    if (!backend) return;
    setSaving(true);
    const updated: Profile = {
      ...profile,
      weight: Number.parseFloat(weight) || profile.weight,
      goal,
      exerciseFrequency,
      ingredientAvoidances: avoidances,
      dailyCalorieTarget: BigInt(
        Number.parseInt(dailyTarget) || Number(profile.dailyCalorieTarget),
      ),
    };
    try {
      await backend.saveCallerUserProfile(updated);
      onProfileUpdate(updated);
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple text-base";
  const selectClass =
    "w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple text-base";

  return (
    <div className="flex flex-col">
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold gradient-text">Settings</h1>
        <p className="text-muted-foreground text-sm">
          {profile.firstName} {profile.lastName}
        </p>
      </header>

      <div className="px-5 flex flex-col gap-5">
        {/* Profile info */}
        <div className="card-dark p-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Profile
          </h2>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #22C1C3)",
              }}
            >
              {profile.firstName?.[0]}
              {profile.lastName?.[0]}
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile.birthday} · {profile.gender}
              </p>
            </div>
          </div>
        </div>

        {/* Adjustable settings */}
        <div className="card-dark p-4 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Fitness Settings
          </h2>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="settings-weight"
              className="text-sm text-muted-foreground"
            >
              Weight (kg)
            </label>
            <input
              id="settings-weight"
              data-ocid="settings.input"
              type="number"
              className={inputClass}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="settings-goal"
              className="text-sm text-muted-foreground"
            >
              Goal
            </label>
            <select
              id="settings-goal"
              data-ocid="settings.select"
              className={selectClass}
              value={goal}
              onChange={(e) => setGoal(e.target.value as Goal)}
            >
              <option value={Goal.lose}>Lose Weight</option>
              <option value={Goal.maintain}>Maintain Weight</option>
              <option value={Goal.gain}>Gain Weight</option>
              <option value={Goal.other}>Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="settings-exercise"
              className="text-sm text-muted-foreground"
            >
              Exercise Frequency
            </label>
            <select
              id="settings-exercise"
              data-ocid="settings.select"
              className={selectClass}
              value={exerciseFrequency}
              onChange={(e) =>
                setExerciseFrequency(e.target.value as ExerciseFrequency)
              }
            >
              <option value={ExerciseFrequency.none}>No Exercise</option>
              <option value={ExerciseFrequency.once}>1x per week</option>
              <option value={ExerciseFrequency.twice}>2x per week</option>
              <option value={ExerciseFrequency.three}>3x per week</option>
              <option value={ExerciseFrequency.fourPlus}>4+ per week</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="settings-calories"
              className="text-sm text-muted-foreground"
            >
              Daily Calorie Target
            </label>
            <input
              id="settings-calories"
              data-ocid="settings.input"
              type="number"
              className={inputClass}
              value={dailyTarget}
              onChange={(e) => setDailyTarget(e.target.value)}
            />
          </div>
        </div>

        {/* Avoidances */}
        <div className="card-dark p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Ingredient Avoidances
          </h2>
          <div className="flex flex-wrap gap-2">
            {INGREDIENT_OPTIONS.map((item) => (
              <button
                type="button"
                key={item}
                data-ocid="settings.toggle"
                onClick={() => toggleAvoidance(item)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                  avoidances.includes(item)
                    ? "border-brand-purple bg-brand-purple/20 text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          type="button"
          data-ocid="settings.save_button"
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 rounded-full text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #22C1C3)" }}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </button>

        {/* Logout */}
        <div className="card-dark p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Account
          </h2>
          <button
            type="button"
            data-ocid="settings.delete_button"
            onClick={clear}
            className="flex items-center gap-3 text-destructive hover:text-destructive/80 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>

        <footer className="mt-2 mb-4 text-center text-muted-foreground text-xs">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
