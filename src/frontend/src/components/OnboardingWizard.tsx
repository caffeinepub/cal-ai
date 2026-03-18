import { ChevronLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { ExerciseFrequency, Goal } from "../backend";
import type { Profile } from "../backend";
import { useActor } from "../hooks/useActor";

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

function calculateCalories(data: {
  weight: number;
  birthday: string;
  gender: string;
  exerciseFrequency: ExerciseFrequency;
  goal: Goal;
}): number {
  const birthDate = new Date(data.birthday);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const heightCm = data.gender === "Male" ? 170 : 160;
  const weightKg = data.weight;

  let bmr: number;
  if (data.gender === "Male") {
    bmr = 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
  } else {
    bmr = 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
  }

  const multipliers: Record<ExerciseFrequency, number> = {
    [ExerciseFrequency.none]: 1.2,
    [ExerciseFrequency.once]: 1.375,
    [ExerciseFrequency.twice]: 1.375,
    [ExerciseFrequency.three]: 1.55,
    [ExerciseFrequency.fourPlus]: 1.725,
  };
  const tdee = bmr * multipliers[data.exerciseFrequency];

  const goalAdj: Record<Goal, number> = {
    [Goal.lose]: -300,
    [Goal.maintain]: 0,
    [Goal.gain]: 300,
    [Goal.other]: 0,
  };
  return Math.round(tdee + goalAdj[data.goal]);
}

interface Props {
  onComplete: (profile: Profile) => void;
}

export default function OnboardingWizard({ onComplete }: Props) {
  const { actor: backend } = useActor();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [animating, setAnimating] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState<Goal>(Goal.maintain);
  const [gender, setGender] = useState("Male");
  const [exerciseFrequency, setExerciseFrequency] = useState<ExerciseFrequency>(
    ExerciseFrequency.twice,
  );
  const [avoidances, setAvoidances] = useState<string[]>([]);
  const [dailyTarget, setDailyTarget] = useState(2000);

  const TOTAL_STEPS = 8;

  const STEP_TITLES = [
    "Your Name",
    "Basic Info",
    "Your Goal",
    "Gender",
    "Exercise Frequency",
    "Ingredients to Avoid",
    "Calculating Your Plan",
    "Your Daily Target",
  ];

  const STEP_SUBTITLES = [
    "Enter your first and last name",
    "Used to calculate your calorie needs",
    "Set your calorie target direction",
    "Affects your BMR calculation",
    "Your activity level for TDEE",
    "We'll flag foods with these",
    "Based on Harris-Benedict formula",
    "Personalized just for you",
  ];

  const canGoNext = (() => {
    switch (step) {
      case 0:
        return firstName.trim() !== "" && lastName.trim() !== "";
      case 1:
        return birthday !== "" && weight !== "";
      default:
        return true;
    }
  })();

  const goNext = () => {
    if (step === 6) {
      const cal = calculateCalories({
        weight: Number.parseFloat(weight) || 70,
        birthday: birthday || "1990-01-01",
        gender,
        exerciseFrequency,
        goal,
      });
      setDailyTarget(cal);
    }
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setAnimating(false);
    }, 200);
  };

  const goPrev = () => {
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setAnimating(false);
    }, 200);
  };

  const handleFinish = async () => {
    if (!backend) return;
    setSaving(true);
    const profile: Profile = {
      firstName,
      lastName,
      birthday: birthday || "1990-01-01",
      weight: Number.parseFloat(weight) || 70,
      goal,
      gender,
      exerciseFrequency,
      ingredientAvoidances: avoidances,
      dailyCalorieTarget: BigInt(dailyTarget),
    };
    try {
      await backend.saveCallerUserProfile(profile);
      onComplete(profile);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleAvoidance = (item: string) => {
    setAvoidances((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  const inputClass =
    "w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple text-base";

  const SelectionCard = ({
    label,
    icon,
    selected,
    onClick,
  }: {
    label: string;
    icon: string;
    selected: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-4 rounded-2xl border-2 transition-all duration-200 text-left ${
        selected
          ? "border-brand-purple bg-brand-purple/10 text-foreground"
          : "border-border bg-secondary text-muted-foreground hover:border-brand-purple/50"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-medium">{label}</span>
      {selected && <span className="ml-auto text-brand-purple">✓</span>}
    </button>
  );

  const stepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="ob-first-name"
                className="text-sm text-muted-foreground"
              >
                First Name
              </label>
              <input
                id="ob-first-name"
                data-ocid="onboarding.input"
                className={inputClass}
                placeholder="e.g. Alex"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="ob-last-name"
                className="text-sm text-muted-foreground"
              >
                Last Name
              </label>
              <input
                id="ob-last-name"
                className={inputClass}
                placeholder="e.g. Johnson"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="ob-birthday"
                className="text-sm text-muted-foreground"
              >
                Birthday
              </label>
              <input
                id="ob-birthday"
                type="date"
                className={inputClass}
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="ob-weight"
                className="text-sm text-muted-foreground"
              >
                Weight (kg)
              </label>
              <input
                id="ob-weight"
                type="number"
                className={inputClass}
                placeholder="e.g. 70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col gap-3">
            <SelectionCard
              label="Lose Weight"
              icon="🔥"
              selected={goal === Goal.lose}
              onClick={() => setGoal(Goal.lose)}
            />
            <SelectionCard
              label="Maintain Weight"
              icon="⚖️"
              selected={goal === Goal.maintain}
              onClick={() => setGoal(Goal.maintain)}
            />
            <SelectionCard
              label="Gain Weight"
              icon="💪"
              selected={goal === Goal.gain}
              onClick={() => setGoal(Goal.gain)}
            />
            <SelectionCard
              label="Other"
              icon="🎯"
              selected={goal === Goal.other}
              onClick={() => setGoal(Goal.other)}
            />
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col gap-3">
            <SelectionCard
              label="Male"
              icon="👨"
              selected={gender === "Male"}
              onClick={() => setGender("Male")}
            />
            <SelectionCard
              label="Female"
              icon="👩"
              selected={gender === "Female"}
              onClick={() => setGender("Female")}
            />
            <SelectionCard
              label="Other / Prefer not to say"
              icon="🧑"
              selected={gender === "Other"}
              onClick={() => setGender("Other")}
            />
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col gap-3">
            <SelectionCard
              label="No Exercise"
              icon="🛋️"
              selected={exerciseFrequency === ExerciseFrequency.none}
              onClick={() => setExerciseFrequency(ExerciseFrequency.none)}
            />
            <SelectionCard
              label="1x per week"
              icon="🚶"
              selected={exerciseFrequency === ExerciseFrequency.once}
              onClick={() => setExerciseFrequency(ExerciseFrequency.once)}
            />
            <SelectionCard
              label="2x per week"
              icon="🏃"
              selected={exerciseFrequency === ExerciseFrequency.twice}
              onClick={() => setExerciseFrequency(ExerciseFrequency.twice)}
            />
            <SelectionCard
              label="3x per week"
              icon="🏋️"
              selected={exerciseFrequency === ExerciseFrequency.three}
              onClick={() => setExerciseFrequency(ExerciseFrequency.three)}
            />
            <SelectionCard
              label="4+ per week"
              icon="⚡"
              selected={exerciseFrequency === ExerciseFrequency.fourPlus}
              onClick={() => setExerciseFrequency(ExerciseFrequency.fourPlus)}
            />
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Select ingredients you want to avoid or limit:
            </p>
            <div className="flex flex-wrap gap-2">
              {INGREDIENT_OPTIONS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleAvoidance(item)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 ${
                    avoidances.includes(item)
                      ? "border-brand-purple bg-brand-purple/20 text-foreground"
                      : "border-border text-muted-foreground hover:border-brand-purple/50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="flex flex-col items-center gap-6">
            <p className="text-muted-foreground text-center">
              We&apos;re calculating your personalized calorie plan based on
              your profile...
            </p>
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full animate-pulse-ring"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(34,193,195,0.3))",
                }}
              />
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6, #22C1C3)",
                }}
              >
                <span className="text-white text-4xl">🎯</span>
              </div>
            </div>
            <p className="text-foreground text-center font-medium">
              Your target is ready!
            </p>
            <p className="text-muted-foreground text-sm text-center">
              Click Next to reveal your daily calorie goal.
            </p>
          </div>
        );
      case 7:
        return (
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full animate-pulse-ring"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(34,193,195,0.4))",
                }}
              />
              <div
                className="absolute inset-4 rounded-full animate-pulse-ring"
                style={{
                  animationDelay: "0.5s",
                  background:
                    "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,193,195,0.2))",
                }}
              />
              <div
                className="w-36 h-36 rounded-full flex flex-col items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6, #22C1C3)",
                }}
              >
                <span className="text-white text-3xl font-bold">
                  {dailyTarget}
                </span>
                <span className="text-white/80 text-xs">cal / day</span>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold gradient-text">
                You&apos;re all set, {firstName || "there"}! 🎉
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Your personalized {dailyTarget} calorie daily target is ready.
                Let&apos;s start your journey!
              </p>
            </div>
            <button
              type="button"
              data-ocid="onboarding.submit_button"
              onClick={handleFinish}
              disabled={saving}
              className="w-full h-14 rounded-full text-white font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #22C1C3)",
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                </>
              ) : (
                "Start My Journey 🚀"
              )}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start px-5 pt-12 pb-8">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Progress */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              data-ocid="onboarding.cancel_button"
              onClick={goPrev}
              className={`p-2 rounded-full transition-opacity ${step === 0 ? "opacity-0 pointer-events-none" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-muted-foreground">
              {step + 1} / {TOTAL_STEPS}
            </span>
            <div className="w-9" />
          </div>
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
                background: "linear-gradient(90deg, #8B5CF6, #22C1C3)",
              }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-foreground">
            {STEP_TITLES[step]}
          </h2>
          <p className="text-muted-foreground text-sm">
            {STEP_SUBTITLES[step]}
          </p>
        </div>

        {/* Content */}
        <div
          className="flex flex-col gap-6 transition-all duration-200"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? "translateY(8px)" : "translateY(0)",
          }}
        >
          {stepContent()}
        </div>

        {/* Next button */}
        {step < 7 && (
          <button
            type="button"
            data-ocid="onboarding.primary_button"
            onClick={goNext}
            disabled={!canGoNext}
            className="w-full h-14 rounded-full text-white font-semibold text-base transition-all duration-200 active:scale-95 mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #22C1C3)" }}
          >
            {step === 6 ? "Reveal My Goal ✨" : "Next →"}
          </button>
        )}
      </div>
    </div>
  );
}
