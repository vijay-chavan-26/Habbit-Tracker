import {
  useState,
  useEffect,
  useContext,
  createContext,
  useCallback,
  useMemo,
} from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Health",
  "Fitness",
  "Learning",
  "Productivity",
  "Mindfulness",
  "Social",
  "Finance",
  "Creative",
];
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"];
const DIFFICULTY_WEIGHTS = { Easy: 1, Medium: 1.5, Hard: 2, Expert: 3 };
const FREQUENCIES = ["Daily", "Weekdays", "Weekends", "Weekly"];

const CATEGORY_COLORS = {
  Health: "#10b981",
  Fitness: "#f59e0b",
  Learning: "#6366f1",
  Productivity: "#3b82f6",
  Mindfulness: "#8b5cf6",
  Social: "#ec4899",
  Finance: "#14b8a6",
  Creative: "#f97316",
};

const ICONS = [
   "📖",
  "🎤",
  "⏰",
  "💪",
  "🧘",
  "📚",
  "💻",
  "🏃",
  "🥗",
  "💧",
  "🎯",
  "✍️",
  "🎸",
  "💰",
  "😴",
  "🧠",
  "🌿",
  "🏋️",
  "📝",
];

const QUOTES = [
  "Small daily improvements are the key to staggering long-term results.",
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
  "Motivation gets you started. Habit keeps you going.",
  "The secret of your future is hidden in your daily routine.",
  "You will never change your life until you change something you do daily.",
];

const DEFAULT_HABITS = [
 
];

const DEFAULT_USER = {
  name: "Vijay Chavan",
  avatar: "👨‍💻",
  joinDate: new Date().toISOString().split("T")[0],
};
// ─── UTILS ───────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0];

const formatDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const generateSampleData = (habits) => {
  const updated = habits.map((h) => {
    const dates = [];
    for (let i = 60; i >= 0; i--) {
      if (Math.random() > 0.3) dates.push(daysAgo(i));
    }
    return { ...h, completedDates: dates };
  });
  return updated.map((h) => ({
    ...h,
    streak: calcStreak(h.completedDates),
    longestStreak: calcLongestStreak(h.completedDates),
  }));
};

const calcStreak = (dates) => {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  let streak = 0;
  let current = today();
  for (const d of sorted) {
    if (d === current || d === daysAgo(streak)) {
      streak++;
      current = daysAgo(streak);
    } else break;
  }
  return streak;
};

const calcLongestStreak = (dates) => {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates)].sort();
  let max = 1,
    cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) {
      cur++;
      max = Math.max(max, cur);
    } else cur = 1;
  }
  return max;
};

const calcScore = (habit) => {
  if (!habit.completedDates.length) return 0;
  const days = Math.max(
    1,
    Math.floor((new Date() - new Date(habit.createdDate)) / 86400000),
  );
  const rate = habit.completedDates.length / days;
  return Math.min(
    100,
    Math.round(rate * DIFFICULTY_WEIGHTS[habit.difficulty] * 100),
  );
};

const isCompletedToday = (habit) => habit.completedDates.includes(today());

const generateId = () => Math.random().toString(36).substr(2, 9);

// ─── STORAGE ─────────────────────────────────────────────────────────────────

const Storage = {
  get: (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  },
};

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

const AppProvider = ({ children }) => {
  const [habits, setHabits] = useState(() => {
    const stored = Storage.get("habits", null);
    if (stored) return stored;
    const sample = generateSampleData(DEFAULT_HABITS);
    Storage.set("habits", sample);
    return sample;
  });

  const [user] = useState(() => Storage.get("user", DEFAULT_USER));
  const [page, setPage] = useState("dashboard");
  const [filterCategory, setFilterCategory] = useState("All");
  const [darkMode, setDarkMode] = useState(() =>
    Storage.get("darkMode", false),
  );

  useEffect(() => {
    Storage.set("habits", habits);
  }, [habits]);
  useEffect(() => {
    Storage.set("darkMode", darkMode);
  }, [darkMode]);

  const toggleHabit = useCallback((id) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const t = today();
        const done = h.completedDates.includes(t);
        const newDates = done
          ? h.completedDates.filter((d) => d !== t)
          : [...h.completedDates, t];
        return {
          ...h,
          completedDates: newDates,
          streak: calcStreak(newDates),
          longestStreak: Math.max(h.longestStreak, calcLongestStreak(newDates)),
        };
      }),
    );
  }, []);

  const addHabit = useCallback((habit) => {
    const newHabit = {
      ...habit,
      id: generateId(),
      completedDates: [],
      streak: 0,
      longestStreak: 0,
      createdDate: today(),
    };
    setHabits((prev) => [...prev, newHabit]);
  }, []);

  const updateHabit = useCallback((id, updates) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    );
  }, []);

  const deleteHabit = useCallback((id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const activeHabits = useMemo(() => habits.filter((h) => !h.paused), [habits]);
  const todayCompleted = useMemo(
    () => activeHabits.filter(isCompletedToday).length,
    [activeHabits],
  );
  const completionRate = useMemo(
    () =>
      activeHabits.length
        ? Math.round((todayCompleted / activeHabits.length) * 100)
        : 0,
    [activeHabits, todayCompleted],
  );

  return (
    <AppContext.Provider
      value={{
        habits,
        activeHabits,
        user,
        page,
        setPage,
        toggleHabit,
        addHabit,
        updateHabit,
        deleteHabit,
        filterCategory,
        setFilterCategory,
        darkMode,
        setDarkMode,
        todayCompleted,
        completionRate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

const useApp = () => useContext(AppContext);

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

// Progress Ring
const ProgressRing = ({ value, size = 80, stroke = 8, color = "#6366f1" }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
};

// Stats Card
const StatCard = ({ icon, label, value, sub, color = "#6366f1" }) => (
  <div
    style={{
      background: "var(--card)",
      borderRadius: 16,
      padding: "20px",
      border: "1px solid var(--border)",
      backdropFilter: "blur(10px)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div>
        <div
          style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "var(--text)",
            fontFamily: "'Clash Display', sans-serif",
          }}
        >
          {value}
        </div>
        {sub && (
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}
          >
            {sub}
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: 28,
          background: `${color}22`,
          borderRadius: 12,
          padding: "8px",
          lineHeight: 1,
        }}
      >
        {icon}
      </div>
    </div>
  </div>
);

// Habit Card
const HabitCard = ({ habit, showActions = false, onEdit, onDelete }) => {
  const { toggleHabit } = useApp();
  const done = isCompletedToday(habit);
  const score = calcScore(habit);

  return (
    <div
      style={{
        background: done ? `${habit.color}15` : "var(--card)",
        borderRadius: 16,
        padding: "16px 20px",
        border: `1.5px solid ${done ? habit.color + "44" : "var(--border)"}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        transition: "all 0.3s ease",
        cursor: "pointer",
        backdropFilter: "blur(10px)",
      }}
      onClick={() => !showActions && toggleHabit(habit.id)}
    >
      <div style={{ fontSize: 28, flexShrink: 0 }}>{habit.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontWeight: 700, color: "var(--text)", fontSize: 15 }}>
            {habit.name}
          </span>
          <span
            style={{
              fontSize: 11,
              background: `${CATEGORY_COLORS[habit.category]}22`,
              color: CATEGORY_COLORS[habit.category],
              borderRadius: 6,
              padding: "2px 8px",
              fontWeight: 600,
            }}
          >
            {habit.category}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          {habit.description}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12 }}>
          <span style={{ color: "#f59e0b" }}>🔥 {habit.streak} streak</span>
          <span style={{ color: "var(--text-muted)" }}>Score: {score}</span>
          <span style={{ color: "var(--text-muted)" }}>{habit.difficulty}</span>
        </div>
      </div>
      {showActions ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(habit);
            }}
            style={{
              background: "var(--border)",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(habit.id);
            }}
            style={{
              background: "#ef444420",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Delete
          </button>
          <button
            style={{
              background: habit.paused ? "#10b98120" : "#f59e0b20",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              color: habit.paused ? "#10b981" : "#f59e0b",
              cursor: "pointer",
              fontSize: 13,
            }}
            onClick={(e) => {
              e.stopPropagation();
              useApp().updateHabit(habit.id, { paused: !habit.paused });
            }}
          >
            {habit.paused ? "Resume" : "Pause"}
          </button>
        </div>
      ) : (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: `2.5px solid ${done ? habit.color : "var(--border)"}`,
            background: done ? habit.color : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.3s ease",
          }}
        >
          {done && (
            <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>
              ✓
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Habit Form Modal
const HabitForm = ({ habit, onSave, onClose }) => {
  const [form, setForm] = useState(
    habit || {
      name: "",
      description: "",
      category: "Health",
      color: "#10b981",
      icon: "💪",
      frequency: "Daily",
      difficulty: "Medium",
    },
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: "var(--card)",
    border: "1.5px solid var(--border)",
    borderRadius: 10,
    color: "var(--text)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-muted)",
    marginBottom: 4,
    display: "block",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--bg)",
          borderRadius: 20,
          padding: 28,
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "var(--text)",
              margin: 0,
            }}
          >
            {habit ? "Edit Habit" : "New Habit"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Habit Name</label>
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Morning Run"
            />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input
              style={inputStyle}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description..."
            />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label style={labelStyle}>Category</label>
              <select
                style={inputStyle}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Difficulty</label>
              <select
                style={inputStyle}
                value={form.difficulty}
                onChange={(e) => set("difficulty", e.target.value)}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label style={labelStyle}>Frequency</label>
              <select
                style={inputStyle}
                value={form.frequency}
                onChange={(e) => set("frequency", e.target.value)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Color Tag</label>
              <input
                type="color"
                style={{ ...inputStyle, padding: 4, height: 42 }}
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Icon</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => set("icon", icon)}
                  style={{
                    fontSize: 22,
                    background:
                      form.icon === icon ? "var(--accent)22" : "var(--card)",
                    border: `2px solid ${form.icon === icon ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: 10,
                    padding: "6px 8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              background: "var(--card)",
              border: "1.5px solid var(--border)",
              borderRadius: 12,
              color: "var(--text)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => form.name && onSave(form)}
            style={{
              flex: 1,
              padding: "12px",
              background:
                "linear-gradient(135deg, var(--accent), var(--accent2))",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {habit ? "Save Changes" : "Add Habit"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── HEATMAP ─────────────────────────────────────────────────────────────────

const Heatmap = ({ habits }) => {
  const weeks = 18;
  const cells = [];
  for (let w = weeks - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const daysBack = w * 7 + (6 - d);
      const date = daysAgo(daysBack);
      const count = habits.filter((h) =>
        h.completedDates.includes(date),
      ).length;
      const intensity = habits.length > 0 ? count / habits.length : 0;
      cells.push({ date, count, intensity });
    }
  }

  const colors = ["#1e293b", "#1e3a5f", "#1d4ed8", "#3b82f6", "#93c5fd"];
  const getColor = (intensity) => {
    if (intensity === 0) return colors[0];
    if (intensity < 0.25) return colors[1];
    if (intensity < 0.5) return colors[2];
    if (intensity < 0.75) return colors[3];
    return colors[4];
  };

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 4, marginLeft: 20, marginBottom: 6 }}>
        {Array.from({ length: weeks }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (weeks - 1 - i) * 7);
          return (
            <div
              key={i}
              style={{
                width: 12,
                textAlign: "center",
                fontSize: 9,
                color: "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              {d.getDate() <= 7 ? months[d.getMonth()].slice(0, 1) : ""}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            paddingTop: 2,
          }}
        >
          {days.map((d, i) => (
            <div
              key={i}
              style={{
                fontSize: 9,
                color: "var(--text-muted)",
                height: 12,
                lineHeight: "12px",
              }}
            >
              {i % 2 === 1 ? d : ""}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${weeks}, 12px)`,
            gridTemplateRows: "repeat(7, 12px)",
            gap: 3,
          }}
        >
          {cells.map((cell, i) => (
            <div
              key={i}
              title={`${cell.date}: ${cell.count} habits`}
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: getColor(cell.intensity),
                transition: "background 0.3s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.target.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.target.style.opacity = "1")}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── PAGES ────────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { activeHabits, user, completionRate, todayCompleted } = useApp();
  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  const totalStreak = activeHabits.reduce((a, h) => a + h.streak, 0);
  const longestEver = Math.max(0, ...activeHabits.map((h) => h.longestStreak));

  const todayHabits = activeHabits.filter((h) => {
    if (h.frequency === "Daily") return true;
    const day = new Date().getDay();
    if (h.frequency === "Weekdays") return day >= 1 && day <= 5;
    if (h.frequency === "Weekends") return day === 0 || day === 6;
    return true;
  });

  return (
    <div
      style={{
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "var(--text)",
              margin: "4px 0 0",
              fontFamily: "'Clash Display', sans-serif",
            }}
          >
            Good{" "}
            {new Date().getHours() < 12
              ? "Morning"
              : new Date().getHours() < 18
                ? "Afternoon"
                : "Evening"}
            , {user.name.split(" ")[0]} {user.avatar}
          </h1>
        </div>
        <div
          style={{
            background: "var(--card)",
            borderRadius: 16,
            padding: "12px 20px",
            border: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ProgressRing
              value={completionRate}
              size={72}
              stroke={7}
              color={completionRate === 100 ? "#10b981" : "var(--accent)"}
            />
            <div
              style={{
                position: "absolute",
                fontSize: 14,
                fontWeight: 800,
                color: "var(--text)",
              }}
            >
              {completionRate}%
            </div>
          </div>
          <div
            style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}
          >
            Today's Progress
          </div>
        </div>
      </div>

      {/* Quote */}
      <div
        style={{
          background:
            "linear-gradient(135deg, var(--accent)22, var(--accent2)22)",
          borderRadius: 16,
          padding: "16px 20px",
          border: "1px solid var(--accent)33",
        }}
      >
        <div
          style={{ fontSize: 13, fontStyle: "italic", color: "var(--text)" }}
        >
          "{quote}"
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
      >
        <StatCard
          icon="✅"
          label="Today Completed"
          value={`${todayCompleted}/${todayHabits.length}`}
          sub="habits done"
          color="#10b981"
        />
        <StatCard
          icon="🔥"
          label="Total Streaks"
          value={totalStreak}
          sub="days combined"
          color="#f59e0b"
        />
        <StatCard
          icon="🏆"
          label="Longest Streak"
          value={longestEver}
          sub="days in a row"
          color="#6366f1"
        />
        <StatCard
          icon="📊"
          label="Active Habits"
          value={activeHabits.length}
          sub="tracking now"
          color="#3b82f6"
        />
      </div>

      {/* Today's Habits */}
      <div>
        <h2
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 14,
          }}
        >
          Today's Habits
        </h2>
        {todayHabits.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--text-muted)",
            }}
          >
            No habits yet. Add some in Habit Manager!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {todayHabits.map((h) => (
              <HabitCard key={h.id} habit={h} />
            ))}
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div
        style={{
          background: "var(--card)",
          borderRadius: 16,
          padding: "20px",
          border: "1px solid var(--border)",
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 16,
          }}
        >
          Activity Heatmap
        </h3>
        <Heatmap habits={activeHabits} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
            justifyContent: "flex-end",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Less</span>
          {["#1e293b", "#1e3a5f", "#1d4ed8", "#3b82f6", "#93c5fd"].map(
            (c, i) => (
              <div
                key={i}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: c,
                }}
              />
            ),
          )}
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>More</span>
        </div>
      </div>
    </div>
  );
};

// ─── HABIT MANAGER ────────────────────────────────────────────────────────────

const HabitManager = () => {
  const {
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    filterCategory,
    setFilterCategory,
  } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = habits.filter((h) => {
    const matchCat = filterCategory === "All" || h.category === filterCategory;
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSave = (form) => {
    if (editHabit) {
      updateHabit(editHabit.id, form);
      setEditHabit(null);
    } else addHabit(form);
    setShowForm(false);
  };

  const handleEdit = (habit) => {
    setEditHabit(habit);
    setShowForm(true);
  };
  const handleDelete = (id) => {
    if (confirm("Delete this habit?")) deleteHabit(id);
  };

  return (
    <div
      style={{
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: "var(--text)",
            fontFamily: "'Clash Display', sans-serif",
          }}
        >
          Habit Manager
        </h1>
        <button
          onClick={() => {
            setEditHabit(null);
            setShowForm(true);
          }}
          style={{
            background:
              "linear-gradient(135deg, var(--accent), var(--accent2))",
            border: "none",
            borderRadius: 12,
            padding: "10px 20px",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          + New Habit
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search habits..."
          style={{
            flex: 1,
            minWidth: 200,
            padding: "10px 14px",
            background: "var(--card)",
            border: "1.5px solid var(--border)",
            borderRadius: 10,
            color: "var(--text)",
            fontSize: 14,
            outline: "none",
          }}
        />
        {["All", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: `1.5px solid ${filterCategory === c ? "var(--accent)" : "var(--border)"}`,
              background:
                filterCategory === c ? "var(--accent)22" : "var(--card)",
              color:
                filterCategory === c ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Habit List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: "var(--text-muted)",
            }}
          >
            No habits found.
          </div>
        ) : (
          filtered.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              showActions
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {showForm && (
        <HabitForm
          habit={editHabit}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditHabit(null);
          }}
        />
      )}
    </div>
  );
};

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────

const CalendarView = () => {
  const { activeHabits } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getDateStr = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getCompletionForDay = (day) => {
    const dateStr = getDateStr(day);
    const done = activeHabits.filter((h) =>
      h.completedDates.includes(dateStr),
    ).length;
    return activeHabits.length > 0 ? done / activeHabits.length : 0;
  };

  const prev = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const next = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const todayStr = today();

  return (
    <div style={{ padding: "24px 0" }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 900,
          color: "var(--text)",
          marginBottom: 24,
          fontFamily: "'Clash Display', sans-serif",
        }}
      >
        Calendar View
      </h1>

      <div
        style={{
          background: "var(--card)",
          borderRadius: 20,
          padding: 24,
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <button
            onClick={prev}
            style={{
              background: "var(--border)",
              border: "none",
              borderRadius: 10,
              padding: "8px 16px",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            ←
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            onClick={next}
            style={{
              background: "var(--border)",
              border: "none",
              borderRadius: 10,
              padding: "8px 16px",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            →
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 8,
            marginBottom: 8,
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-muted)",
                padding: "4px 0",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 8,
          }}
        >
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = getDateStr(day);
            const rate = getCompletionForDay(day);
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const done = activeHabits.filter((h) =>
              h.completedDates.includes(dateStr),
            ).length;
            const alpha = isFuture ? 0 : rate;
            const bg =
              alpha > 0
                ? `rgba(99,102,241,${0.2 + alpha * 0.6})`
                : "var(--card-dark)";

            return (
              <div
                key={day}
                title={`${done}/${activeHabits.length} habits`}
                style={{
                  aspectRatio: "1",
                  borderRadius: 10,
                  background: bg,
                  border: isToday
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isToday ? 800 : 500,
                    color: alpha > 0.5 ? "#fff" : "var(--text)",
                  }}
                >
                  {day}
                </span>
                {!isFuture && done > 0 && (
                  <div
                    style={{
                      fontSize: 9,
                      color:
                        alpha > 0.5
                          ? "rgba(255,255,255,0.8)"
                          : "var(--text-muted)",
                    }}
                  >
                    {done}/{activeHabits.length}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
              <div
                key={i}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: `rgba(99,102,241,${0.2 + v * 0.6})`,
                }}
              />
            ))}
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Completion Rate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

const Analytics = () => {
  const { activeHabits } = useApp();

  // Weekly data
  const weeklyData = Array.from({ length: 7 }).map((_, i) => {
    const date = daysAgo(6 - i);
    const done = activeHabits.filter((h) =>
      h.completedDates.includes(date),
    ).length;
    return {
      day: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
      completed: done,
      total: activeHabits.length,
      rate: activeHabits.length
        ? Math.round((done / activeHabits.length) * 100)
        : 0,
    };
  });

  // Monthly trend (last 30 days)
  const monthlyData = Array.from({ length: 30 })
    .map((_, i) => {
      const date = daysAgo(29 - i);
      const done = activeHabits.filter((h) =>
        h.completedDates.includes(date),
      ).length;
      return {
        date: formatDate(date),
        rate: activeHabits.length
          ? Math.round((done / activeHabits.length) * 100)
          : 0,
      };
    })
    .filter((_, i) => i % 3 === 0);

  // Category breakdown
  const categoryData = CATEGORIES.map((cat) => {
    const catHabits = activeHabits.filter((h) => h.category === cat);
    if (!catHabits.length) return null;
    const totalDone = catHabits.reduce(
      (a, h) => a + h.completedDates.length,
      0,
    );
    const totalPossible =
      catHabits.length *
      Math.max(
        1,
        Math.floor(
          (new Date() - new Date(catHabits[0].createdDate)) / 86400000,
        ),
      );
    return {
      name: cat,
      value: Math.round((totalDone / totalPossible) * 100),
      color: CATEGORY_COLORS[cat],
    };
  }).filter(Boolean);

  // Radar data
  const radarData = CATEGORIES.map((cat) => {
    const catHabits = activeHabits.filter((h) => h.category === cat);
    return {
      category: cat.slice(0, 3),
      score: catHabits.length
        ? Math.round(
            catHabits.reduce((a, h) => a + calcScore(h), 0) / catHabits.length,
          )
        : 0,
    };
  });

  // Habit comparison
  const habitCompare = activeHabits.slice(0, 6).map((h) => ({
    name: h.name.length > 14 ? h.name.slice(0, 14) + "…" : h.name,
    score: calcScore(h),
    streak: h.streak,
    color: h.color,
  }));

  const chartTooltip = {
    contentStyle: {
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      color: "var(--text)",
      fontSize: 12,
    },
  };

  return (
    <div
      style={{
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 900,
          color: "var(--text)",
          fontFamily: "'Clash Display', sans-serif",
        }}
      >
        Analytics
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {/* Weekly Bar Chart */}
        <div
          style={{
            background: "var(--card)",
            borderRadius: 16,
            padding: 20,
            border: "1px solid var(--border)",
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            This Week
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="day"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip {...chartTooltip} />
              <Bar
                dataKey="completed"
                fill="var(--accent)"
                radius={[6, 6, 0, 0]}
                name="Completed"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Line Chart */}
        <div
          style={{
            background: "var(--card)",
            borderRadius: 16,
            padding: 20,
            border: "1px solid var(--border)",
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            30-Day Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip {...chartTooltip} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="var(--accent)"
                strokeWidth={2.5}
                dot={false}
                name="Rate %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        {categoryData.length > 0 && (
          <div
            style={{
              background: "var(--card)",
              borderRadius: 16,
              padding: 20,
              border: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 16,
              }}
            >
              By Category
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {categoryData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltip} formatter={(v) => `${v}%`} />
                <Legend
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Radar Chart */}
        <div
          style={{
            background: "var(--card)",
            borderRadius: 16,
            padding: 20,
            border: "1px solid var(--border)",
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            Habit Balance
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="var(--accent)"
                fill="var(--accent)"
                fillOpacity={0.3}
              />
              <Tooltip {...chartTooltip} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Habit Comparison */}
        {habitCompare.length > 0 && (
          <div
            style={{
              background: "var(--card)",
              borderRadius: 16,
              padding: 20,
              border: "1px solid var(--border)",
              gridColumn: "span 2",
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 16,
              }}
            >
              Habit Performance Scores
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={habitCompare} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  width={100}
                />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} name="Score">
                  {habitCompare.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── INSIGHTS ────────────────────────────────────────────────────────────────

const Insights = () => {
  const { activeHabits } = useApp();

  const insights = useMemo(() => {
    if (!activeHabits.length) return [];

    const sorted = [...activeHabits].sort(
      (a, b) => calcScore(b) - calcScore(a),
    );
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const mostStreak = [...activeHabits].sort((a, b) => b.streak - a.streak)[0];
    const longestEver = [...activeHabits].sort(
      (a, b) => b.longestStreak - a.longestStreak,
    )[0];
    const avgRate = Math.round(
      activeHabits.reduce((a, h) => a + calcScore(h), 0) / activeHabits.length,
    );

    // Day of week analysis
    const dayCount = Array(7).fill(0);
    activeHabits.forEach((h) =>
      h.completedDates.forEach((d) => dayCount[new Date(d).getDay()]++),
    );
    const bestDayIdx = dayCount.indexOf(Math.max(...dayCount));
    const worstDayIdx = dayCount.indexOf(Math.min(...dayCount));
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return [
      {
        icon: "🏆",
        label: "Best Performing",
        title: best?.name,
        value: `Score: ${calcScore(best)}`,
        color: "#10b981",
      },
      {
        icon: "💪",
        label: "Needs Attention",
        title: worst?.name,
        value: `Score: ${calcScore(worst)}`,
        color: "#ef4444",
      },
      {
        icon: "🔥",
        label: "Hottest Streak",
        title: mostStreak?.name,
        value: `${mostStreak?.streak} days`,
        color: "#f59e0b",
      },
      {
        icon: "🥇",
        label: "Longest Ever",
        title: longestEver?.name,
        value: `${longestEver?.longestStreak} days`,
        color: "#6366f1",
      },
      {
        icon: "📊",
        label: "Avg Score",
        title: "All Habits",
        value: `${avgRate}/100`,
        color: "#3b82f6",
      },
      {
        icon: "📅",
        label: "Best Day",
        title: dayNames[bestDayIdx],
        value: `${dayCount[bestDayIdx]} completions`,
        color: "#8b5cf6",
      },
      {
        icon: "😴",
        label: "Worst Day",
        title: dayNames[worstDayIdx],
        value: `${dayCount[worstDayIdx]} completions`,
        color: "#ec4899",
      },
    ];
  }, [activeHabits]);

  // Achievements
  const achievements = useMemo(() => {
    const list = [];
    const totalDone = activeHabits.reduce(
      (a, h) => a + h.completedDates.length,
      0,
    );
    const maxStreak = Math.max(0, ...activeHabits.map((h) => h.streak));
    const maxLongest = Math.max(0, ...activeHabits.map((h) => h.longestStreak));

    if (activeHabits.length >= 1)
      list.push({
        icon: "🌱",
        title: "Getting Started",
        desc: "Added first habit",
        unlocked: true,
      });
    if (activeHabits.length >= 5)
      list.push({
        icon: "🌟",
        title: "Habit Collector",
        desc: "5+ active habits",
        unlocked: true,
      });
    if (maxStreak >= 7)
      list.push({
        icon: "🔥",
        title: "Week Warrior",
        desc: "7-day streak",
        unlocked: true,
      });
    else
      list.push({
        icon: "🔥",
        title: "Week Warrior",
        desc: "7-day streak",
        unlocked: false,
        progress: maxStreak,
        goal: 7,
      });
    if (maxLongest >= 30)
      list.push({
        icon: "💎",
        title: "Month Master",
        desc: "30-day streak",
        unlocked: true,
      });
    else
      list.push({
        icon: "💎",
        title: "Month Master",
        desc: "30-day streak",
        unlocked: false,
        progress: maxLongest,
        goal: 30,
      });
    if (totalDone >= 100)
      list.push({
        icon: "💯",
        title: "Century Club",
        desc: "100 completions",
        unlocked: true,
      });
    else
      list.push({
        icon: "💯",
        title: "Century Club",
        desc: "100 completions",
        unlocked: false,
        progress: totalDone,
        goal: 100,
      });
    if (maxStreak >= 100)
      list.push({
        icon: "🌈",
        title: "Centurion",
        desc: "100-day streak",
        unlocked: true,
      });
    else
      list.push({
        icon: "🌈",
        title: "Centurion",
        desc: "100-day streak",
        unlocked: false,
        progress: maxLongest,
        goal: 100,
      });

    return list;
  }, [activeHabits]);

  return (
    <div
      style={{
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 900,
          color: "var(--text)",
          fontFamily: "'Clash Display', sans-serif",
        }}
      >
        Insights
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        {insights.map((ins, i) => (
          <div
            key={i}
            style={{
              background: "var(--card)",
              borderRadius: 16,
              padding: "18px 20px",
              border: "1px solid var(--border)",
              display: "flex",
              gap: 14,
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 28,
                background: `${ins.color}22`,
                borderRadius: 12,
                padding: "8px",
                flexShrink: 0,
              }}
            >
              {ins.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontWeight: 600,
                }}
              >
                {ins.label}
              </div>
              <div
                style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}
              >
                {ins.title}
              </div>
              <div style={{ fontSize: 13, color: ins.color, fontWeight: 600 }}>
                {ins.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 16,
          }}
        >
          🏅 Achievements
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {achievements.map((a, i) => (
            <div
              key={i}
              style={{
                background: "var(--card)",
                borderRadius: 16,
                padding: "18px",
                border: `1.5px solid ${a.unlocked ? "var(--accent)44" : "var(--border)"}`,
                opacity: a.unlocked ? 1 : 0.6,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  marginBottom: 8,
                  filter: a.unlocked ? "none" : "grayscale(1)",
                }}
              >
                {a.icon}
              </div>
              <div
                style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}
              >
                {a.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                {a.desc}
              </div>
              {!a.unlocked && (
                <div style={{ marginTop: 10 }}>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 4,
                      background: "var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, (a.progress / a.goal) * 100)}%`,
                        background: "var(--accent)",
                        borderRadius: 4,
                        transition: "width 1s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    {a.progress}/{a.goal}
                  </div>
                </div>
              )}
              {a.unlocked && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#10b981",
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  ✓ Unlocked
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── NAV ──────────────────────────────────────────────────────────────────────

const Nav = () => {
  const { page, setPage, darkMode, setDarkMode, completionRate } = useApp();

  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "manager", icon: "✏️", label: "Habits" },
    { id: "calendar", icon: "📅", label: "Calendar" },
    { id: "analytics", icon: "📊", label: "Analytics" },
    { id: "insights", icon: "💡", label: "Insights" },
  ];

  return (
    <>
      {/* Sidebar for desktop */}
      <nav
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: 220,
          background: "var(--nav-bg)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
          zIndex: 100,
          backdropFilter: "blur(20px)",
        }}
        className="desktop-nav"
      >
        <div
          style={{
            padding: "0 20px 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              background:
                "linear-gradient(135deg, var(--accent), var(--accent2))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "'Clash Display', sans-serif",
            }}
          >
            HabitFlow
          </div>
          <div
            style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
          >
            Track. Grow. Thrive.
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                background:
                  page === item.id
                    ? "linear-gradient(135deg, var(--accent)22, var(--accent2)22)"
                    : "transparent",
                color: page === item.id ? "var(--accent)" : "var(--text-muted)",
                fontWeight: page === item.id ? 700 : 500,
                fontSize: 14,
                transition: "all 0.2s",
                borderLeft:
                  page === item.id
                    ? "3px solid var(--accent)"
                    : "3px solid transparent",
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Today {completionRate}%
          </div>
          <button
            onClick={() => setDarkMode((d) => !d)}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      {/* Bottom Nav for mobile */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          background: "var(--nav-bg)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          zIndex: 100,
          backdropFilter: "blur(20px)",
        }}
        className="mobile-nav"
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "8px 12px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: page === item.id ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span
              style={{ fontSize: 10, fontWeight: page === item.id ? 700 : 500 }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </>
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────

const App = () => {
  const { page, darkMode } = useApp();

  const pages = {
    dashboard: Dashboard,
    manager: HabitManager,
    calendar: CalendarView,
    analytics: Analytics,
    insights: Insights,
  };
  const Page = pages[page] || Dashboard;

  const theme = darkMode
    ? {
        "--bg": "#0f172a",
        "--card": "#1e293b",
        "--card-dark": "#0f172a",
        "--nav-bg": "rgba(15,23,42,0.95)",
        "--border": "#334155",
        "--text": "#f1f5f9",
        "--text-muted": "#94a3b8",
        "--accent": "#818cf8",
        "--accent2": "#c084fc",
      }
    : {
        "--bg": "#f8fafc",
        "--card": "#ffffff",
        "--card-dark": "#f1f5f9",
        "--nav-bg": "rgba(255,255,255,0.95)",
        "--border": "#e2e8f0",
        "--text": "#0f172a",
        "--text-muted": "#64748b",
        "--accent": "#6366f1",
        "--accent2": "#8b5cf6",
      };

  return (
    <div
      style={{
        ...theme,
        background: "var(--bg)",
        minHeight: "100vh",
        color: "var(--text)",
        fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.3s",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); }
        .desktop-nav { display: flex !important; }
        .mobile-nav { display: none !important; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
          .main-content { margin-left: 0 !important; padding-bottom: 80px !important; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
      `}</style>
      <Nav />
      <main
        className="main-content"
        style={{
          marginLeft: 220,
          padding: "0 24px",
          maxWidth: 1100,
          transition: "margin 0.3s",
        }}
      >
        <Page />
      </main>
    </div>
  );
};

export default function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
