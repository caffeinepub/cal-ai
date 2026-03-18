import { ChevronDown, ChevronUp } from "lucide-react";
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
import type { FoodLogEntry, Profile } from "../backend";
import { useActor } from "../hooks/useActor";
import FoodDetailModal from "./FoodDetailModal";

interface Props {
  profile: Profile;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDayLabel(date: Date): string {
  const dayName = DAY_NAMES[date.getDay()];
  const monthName = MONTH_NAMES[date.getMonth()];
  const day = ordinal(date.getDate());
  return `${dayName} ${monthName} ${day}`;
}

interface DayGroup {
  date: Date;
  label: string;
  totalCalories: number;
  entries: FoodLogEntry[];
}

export default function AnalyticsTab({ profile }: Props) {
  const { actor: backend } = useActor();
  const [weeklyData, setWeeklyData] = useState<
    { day: string; calories: number }[]
  >([]);
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<FoodLogEntry | null>(null);

  const target = Number(profile.dailyCalorieTarget);

  useEffect(() => {
    if (!backend) return;

    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const start = new Date(end.getTime() - 7 * 86400000);
    const startNs = BigInt(start.getTime()) * BigInt(1_000_000);
    const endNs = BigInt(end.getTime()) * BigInt(1_000_000);

    Promise.all([
      backend.getWeeklyCalorieHistory(),
      backend.getFoodLogsByDateRange(startNs, endNs),
    ])
      .then(([calHistory, foodLogs]) => {
        const mapped = calHistory.map((cal, i) => ({
          day: DAY_LABELS[i % 7],
          calories: Number(cal),
        }));
        setWeeklyData(mapped);

        // Group by date
        const groups: Record<string, DayGroup> = {};
        for (const entry of foodLogs) {
          const ms = Number(entry.loggedTimestamp) / 1_000_000;
          const d = new Date(ms);
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          if (!groups[key]) {
            const dayDate = new Date(
              d.getFullYear(),
              d.getMonth(),
              d.getDate(),
            );
            groups[key] = {
              date: dayDate,
              label: formatDayLabel(dayDate),
              totalCalories: 0,
              entries: [],
            };
          }
          groups[key].totalCalories += Number(entry.calories);
          groups[key].entries.push(entry);
        }

        const sorted = Object.values(groups).sort(
          (a, b) => b.date.getTime() - a.date.getTime(),
        );
        setDayGroups(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [backend]);

  const total = weeklyData.reduce((a, b) => a + b.calories, 0);
  const avg = weeklyData.length > 0 ? Math.round(total / weeklyData.length) : 0;
  const daysOver = weeklyData.filter((d) => d.calories > target).length;

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

        {/* Food by Day */}
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">
            Food by Day
          </h2>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-dark p-4 h-16 animate-pulse" />
              ))}
            </div>
          ) : dayGroups.length === 0 ? (
            <div
              data-ocid="analytics.empty_state"
              className="card-dark p-8 flex flex-col items-center gap-2 text-center"
            >
              <span className="text-4xl">📊</span>
              <p className="text-muted-foreground text-sm">
                No food logged in the last 7 days.
              </p>
            </div>
          ) : (
            dayGroups.map((group) => {
              const isExpanded = expandedDay === group.label;
              return (
                <div
                  key={group.label}
                  className="card-dark rounded-2xl overflow-hidden"
                >
                  {/* Day header */}
                  <button
                    type="button"
                    data-ocid="analytics.toggle"
                    onClick={() =>
                      setExpandedDay(isExpanded ? null : group.label)
                    }
                    className="w-full p-4 flex items-center justify-between hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-foreground">
                        {group.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {group.entries.length} item
                        {group.entries.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold gradient-text">
                        {group.totalCalories.toLocaleString()} cal
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded food list */}
                  {isExpanded && (
                    <div className="border-t border-border flex flex-col">
                      {group.entries.map((entry, i) => (
                        <button
                          key={Number(entry.loggedTimestamp)}
                          type="button"
                          data-ocid={`analytics.item.${i + 1}`}
                          onClick={() => setSelectedEntry(entry)}
                          className="px-4 py-3 flex items-center gap-3 hover:bg-secondary/40 transition-colors text-left border-b border-border/50 last:border-b-0"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                            style={{
                              background:
                                "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,193,195,0.2))",
                            }}
                          >
                            🍴
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {entry.foodName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                Number(entry.loggedTimestamp) / 1_000_000,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <span className="font-semibold text-sm text-foreground">
                            {Number(entry.calories)} cal
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
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

      <FoodDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
}
