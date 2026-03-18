import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Profile } from "../backend";
import { useActor } from "../hooks/useActor";

interface Props {
  profile: Profile;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AnalyticsTab({ profile }: Props) {
  const { actor: backend } = useActor();
  const [weeklyData, setWeeklyData] = useState<
    { day: string; calories: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const target = Number(profile.dailyCalorieTarget);

  useEffect(() => {
    if (!backend) return;
    backend
      .getWeeklyCalorieHistory()
      .then((data) => {
        const mapped = data.map((cal, i) => ({
          day: DAY_LABELS[i % 7],
          calories: Number(cal),
        }));
        setWeeklyData(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [backend]);

  const total = weeklyData.reduce((a, b) => a + b.calories, 0);
  const avg = weeklyData.length > 0 ? Math.round(total / weeklyData.length) : 0;
  const daysOver = weeklyData.filter((d) => d.calories > target).length;

  // Fill empty days
  const chartData = DAY_LABELS.map((day, i) => ({
    day,
    calories: weeklyData[i]?.calories ?? 0,
  }));

  return (
    <div className="flex flex-col">
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold gradient-text">Analytics</h1>
        <p className="text-muted-foreground text-sm">Weekly overview</p>
      </header>

      <div className="px-5 flex flex-col gap-5">
        {/* Chart */}
        <div className="card-dark p-5">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">
            Calories This Week
          </h2>
          {loading ? (
            <div
              data-ocid="analytics.loading_state"
              className="h-48 flex items-center justify-center"
            >
              <div className="w-8 h-8 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.28 0.015 265)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#A7AFBC", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#A7AFBC", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#151A20",
                    border: "1px solid #242B35",
                    borderRadius: "12px",
                    color: "#F2F4F7",
                  }}
                  cursor={{ fill: "rgba(139,92,246,0.1)" }}
                />
                <ReferenceLine
                  y={target}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: "Target", fill: "#ef4444", fontSize: 10 }}
                />
                <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={`cell-${entry.day}`}
                      fill={entry.calories > target ? "#ef4444" : "#8B5CF6"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Daily Avg",
              value: avg.toLocaleString(),
              unit: "cal",
              color: "#8B5CF6",
            },
            {
              label: "Weekly Total",
              value: total.toLocaleString(),
              unit: "cal",
              color: "#22C1C3",
            },
            {
              label: "Days Over",
              value: daysOver.toString(),
              unit: "days",
              color: daysOver > 3 ? "#ef4444" : "#22c55e",
            },
          ].map((stat) => (
            <div key={stat.label} className="card-dark p-4 flex flex-col gap-1">
              <span className="text-xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground">{stat.unit}</span>
              <span className="text-xs text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Goal comparison */}
        <div className="card-dark p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            vs Daily Target ({target.toLocaleString()} cal)
          </h3>
          <div className="flex flex-col gap-2">
            {chartData.map((day) => {
              const pct = Math.min(
                (day.calories / Math.max(target, 1)) * 100,
                150,
              );
              const over = day.calories > target;
              return (
                <div key={day.day} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8">
                    {day.day}
                  </span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: over
                          ? "#ef4444"
                          : "linear-gradient(90deg, #8B5CF6, #22C1C3)",
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {day.calories > 0 ? day.calories.toLocaleString() : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="mt-8 mb-4 text-center text-muted-foreground text-xs">
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
  );
}
