import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

/**
 * 아쉬운게 없어 (No Regret) — 모바일 웹 스타터
 * -------------------------------------------------------------
 * ▶ 프레임워크: React (단일 파일 컴포넌트)
 * ▶ 스타일: Tailwind (전제)
 * ▶ 차트: recharts (전제)
 * 기능
 * - 이메일 가입(로컬 저장)
 * - 탭 3개: Chat / Today / History
 * - 다국어(한/영) 토글
 * - Chat: 로컬 메시지(멀티 탭 데모용 broadcastChannel)
 * - Today: 오늘 할 일 추가/체크
 * - History: 최근 12주 요약(Line) + 카테고리 분포(Pie)
 */

// ---------------- i18n ----------------
const dict = {
  ko: {
    appName: "아쉬운게 없어",
    appSlogan: "완벽한 사람들을 위하여",
    chat: "채팅",
    today: "오늘",
    history: "히스토리",
    chatPlaceholder: "메시지를 입력하세요…",
    joinTitle: "이메일로 시작하기",
    email: "이메일",
    join: "시작하기",
    logout: "로그아웃",
    addPlan: "할 일 추가",
    add: "추가",
    done: "완료",
    emptyToday: "오늘의 계획을 추가해보세요",
    last3mo: "최근 3개월 요약",
    weeklyActivity: "주별 활동 수",
    categoryShare: "카테고리 비중",
  },
  en: {
    appName: "No Regret",
    appSlogan: "for the perfect ones",
    chat: "Chat",
    today: "Today",
    history: "History",
    chatPlaceholder: "Type a message…",
    joinTitle: "Sign in with Email",
    email: "Email",
    join: "Start",
    logout: "Log out",
    addPlan: "Add a plan",
    add: "Add",
    done: "Done",
    emptyToday: "Add your plan for today",
    last3mo: "Last 3 months",
    weeklyActivity: "Activities per week",
    categoryShare: "Category share",
  },
};

// ---------------- Hand-drawn icon SVGs ----------------
const Pastel = {
  violet: "#E6DAFF",
  mint: "#D8FBEA",
  sky: "#D9EEFF",
};

function WobblyCircle({ fill }: { fill: string }) {
  // 약간 들쭉날쭉한 원 (손그림 느낌)
  return (
    <svg viewBox="0 0 100 100" className="w-8 h-8">
      <path
        d="M50 5 C70 6, 92 14, 95 35 C98 56, 84 86, 55 95 C30 102, 9 85, 6 58 C3 35, 25 8, 50 5Z"
        fill={fill}
        stroke="#111"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChat() {
  return (
    <div className="relative">
      <WobblyCircle fill={Pastel.violet} />
      <svg viewBox="0 0 100 100" className="w-8 h-8 absolute inset-0">
        <path
          d="M26 36 q22-14 44 0 q4 3 4 10 q0 7-5 11 q-14 10-26 8 l-7 11 l1-12 q-10-3-14-9 q-3-5-1-10 q1-6 4-9Z"
          fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round"
        />
        <circle cx="46" cy="50" r="2.2" fill="#111" />
        <circle cx="54" cy="50" r="2.2" fill="#111" />
        <circle cx="62" cy="50" r="2.2" fill="#111" />
      </svg>
    </div>
  );
}
function IconToday() {
  return (
    <div className="relative">
      <WobblyCircle fill={Pastel.mint} />
      <svg viewBox="0 0 100 100" className="w-8 h-8 absolute inset-0">
        <rect x="28" y="35" width="44" height="36" rx="8" fill="none" stroke="#111" strokeWidth="3" />
        <line x1="28" y1="43" x2="72" y2="43" stroke="#111" strokeWidth="3" />
        <line x1="40" y1="30" x2="40" y2="40" stroke="#111" strokeWidth="3" />
        <line x1="60" y1="30" x2="60" y2="40" stroke="#111" strokeWidth="3" />
        <path d="M38 58 l8 8 l18-18" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
function IconHistory() {
  return (
    <div className="relative">
      <WobblyCircle fill={Pastel.sky} />
      <svg viewBox="0 0 100 100" className="w-8 h-8 absolute inset-0">
        <circle cx="50" cy="54" r="20" fill="none" stroke="#111" strokeWidth="3" />
        <line x1="50" y1="54" x2="50" y2="40" stroke="#111" strokeWidth="3" />
        <line x1="50" y1="54" x2="63" y2="54" stroke="#111" strokeWidth="3" />
      </svg>
    </div>
  );
}

// ---------------- Local storage helpers ----------------
const LS_USER = "nr_user";
const LS_TODAY = "nr_today"; // {date: string, items: {id,title,done,cat}[]}
const LS_MSGS = "nr_msgs"; // {email,text,ts}

// ---------------- Types ----------------
interface Msg { email: string; text: string; ts: number }
interface Plan { id: string; title: string; done: boolean; cat: string }
interface TodayData { date: string; items: Plan[] }

// ---------------- Main App ----------------
export default function App() {
  const [lang, setLang] = useState<"ko" | "en">("ko");
  const t = dict[lang];
  const [tab, setTab] = useState<"chat" | "today" | "history">("chat");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LS_USER);
    if (saved) setEmail(JSON.parse(saved));
  }, []);

  const onJoin = (e: string) => {
    localStorage.setItem(LS_USER, JSON.stringify(e));
    setEmail(e);
  };
  const onLogout = () => {
    localStorage.removeItem(LS_USER);
    setEmail(null);
  };

  return (
    <div className="min-h-svh w-full flex items-center justify-center bg-gradient-to-b from-zinc-50 to-emerald-50">
      {/* 메인 카드 */}
      <div className="relative w-[390px] max-w-full h-svh bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-zinc-200 flex flex-col pb-20">
        <Header t={t} lang={lang} setLang={setLang} email={email} onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto p-4">
          {!email ? (
            <JoinCard t={t} onJoin={onJoin} />
          ) : tab === "chat" ? (
            <Chat t={t} email={email} />
          ) : tab === "today" ? (
            <Today t={t} />
          ) : (
            <History t={t} />
          )}
        </main>
      </div>

      {/* 카드 바깥에 탭바 고정 */}
      <TabBar t={t} tab={tab} setTab={setTab} />
    </div>
  );
}

// ---------------- Header ----------------
import donut from "./assets/logo-donut.png";
import { useI18n } from "./i18n";

const Header: React.FC = () => {
  const { t, locale, setLocale } = useI18n();

  return (
    <header className="flex items-start gap-2.5 px-5 py-3 border-b border-slate-200 rounded-t-3xl bg-white">
      <img src={donut} alt="No Regret logo" className="h-6 w-6 mt-[2px] object-contain" />
      <div className="leading-tight">
        <div className="text-[20px] font-semibold tracking-tight text-slate-900">
          {t("header.title")}
        </div>
        <div className="text-[13px] text-slate-500">
          {t("header.subtitle")}
        </div>
      </div>
      <button
        onClick={() => setLocale(locale === "ko" ? "en" : "ko")}
        className="ml-auto inline-flex items-center rounded-full border px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
        aria-label="Change language"
      >
        {t("header.badge")}
      </button>
    </header>
  );
};


// ---------------- Join ----------------
function JoinCard({ t, onJoin }: any) {
  const [val, setVal] = useState("");
  return (
    <div className="mt-10 p-4 rounded-2xl border bg-white shadow-sm">
      <div className="text-sm text-zinc-500 mb-2">{t.joinTitle}</div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-300"
          placeholder={t.email}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <button className="px-4 py-2 rounded-xl bg-zinc-900 text-white" onClick={() => val && onJoin(val)}>
          {t.join}
        </button>
      </div>
    </div>
  );
}

// ---------------- Chat ----------------
function Chat({ t, email }: { t: any; email: string }) {
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    const raw = localStorage.getItem(LS_MSGS);
    return raw ? JSON.parse(raw) : [];
  });
  const [text, setText] = useState("");
  const chRef = useRef<BroadcastChannel | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chRef.current = new BroadcastChannel("nr_chat");
    chRef.current.onmessage = (ev) => {
      setMsgs((m) => [...m, ev.data]);
    };
    return () => chRef.current?.close();
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_MSGS, JSON.stringify(msgs));
    // auto scroll
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs]);

  const send = () => {
    if (!text.trim()) return;
    const m: Msg = { email, text, ts: Date.now() };
    setMsgs((prev) => [...prev, m]);
    chRef.current?.postMessage(m);
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={listRef} className="flex-1 overflow-y-auto space-y-3">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${m.email === email ? "ml-auto bg-emerald-100" : "bg-white border"}`}
          >
            <div className="text-[10px] text-zinc-500 mb-0.5">{m.email}</div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-300"
          placeholder={t.chatPlaceholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="px-4 py-2 rounded-xl bg-zinc-900 text-white" onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}

// ---------------- Today ----------------
function Today({ t }: any) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState<TodayData>(() => {
    const raw = localStorage.getItem(LS_TODAY);
    const def: TodayData = { date: todayKey, items: [] };
    if (!raw) return def;
    const parsed: TodayData = JSON.parse(raw);
    // 날짜 변경 시 초기화
    if (parsed.date !== todayKey) return def;
    return parsed;
  });
  const [input, setInput] = useState("");

  useEffect(() => {
    localStorage.setItem(LS_TODAY, JSON.stringify(data));
  }, [data]);

  const add = () => {
    if (!input.trim()) return;
    const plan: Plan = { id: Math.random().toString(36).slice(2), title: input, done: false, cat: "general" };
    setData((d) => ({ ...d, items: [...d.items, plan] }));
    setInput("");
  };

  const toggle = (id: string) => {
    setData((d) => ({
      ...d,
      items: d.items.map((it) => (it.id === id ? { ...it, done: !it.done } : it)),
    }));
  };

  return (
    <div>
      <div className="mb-3 text-sm text-zinc-500">{t.addPlan}</div>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-300"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="px-4 py-2 rounded-xl bg-zinc-900 text-white" onClick={add}>
          {t.add}
        </button>
      </div>

      <div className="space-y-2">
        {data.items.length === 0 && <div className="text-sm text-zinc-400">{t.emptyToday}</div>}
        {data.items.map((it) => (
          <label key={it.id} className="flex items-center gap-3 p-3 rounded-2xl border bg-white">
            <input type="checkbox" checked={it.done} onChange={() => toggle(it.id)} className="size-5" />
            <span className={`text-sm ${it.done ? "line-through text-zinc-400" : ""}`}>{it.title}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ---------------- History ----------------
function History({ t }: any) {
  // 데모용: Local today 데이터를 최근 12주 누적치로 랜덤 샘플링
  const weeks = 12;
  const weekly = useMemo(() => {
    const arr = Array.from({ length: weeks }).map((_, i) => ({
      w: `W${i + 1}`,
      count: Math.floor(Math.random() * 8) + (i % 3),
    }));
    return arr;
  }, []);

  const pie = useMemo(
    () => [
      { name: "Body", value: 5 },
      { name: "Mind", value: 8 },
      { name: "Work", value: 6 },
      { name: "Social", value: 4 },
    ],
    []
  );

  const pieColors = ["#A78BFA", "#34D399", "#60A5FA", "#FCD34D"]; // 파스텔

  return (
    <div className="space-y-6">
      <section>
        <div className="text-sm text-zinc-500 mb-2">
          {t.last3mo} · {t.weeklyActivity}
        </div>
        <div className="h-44 bg-white rounded-2xl border p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekly} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="w" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#111" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <div className="text-sm text-zinc-500 mb-2">{t.categoryShare}</div>
        <div className="h-56 bg-white rounded-2xl border p-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                {pie.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} stroke="#111" strokeWidth={0.5} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

// ---------------- Tab Bar ----------------
function TabBar({ t, tab, setTab }: {
  t: any;
  tab: "chat" | "today" | "history";
  setTab: React.Dispatch<React.SetStateAction<"chat" | "today" | "history">>;
}) {
  const tabs = [
    { key: "chat", label: t.chat, Icon: IconChat },
    { key: "today", label: t.today, Icon: IconToday },
    { key: "history", label: t.history, Icon: IconHistory },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md shadow-inner">
      <ul className="mx-auto w-[390px] max-w-full grid grid-cols-3">
        {tabs.map(({ key, label, Icon }) => (
          <li key={key}>
            <button
              onClick={() => setTab(key)}
              className={`w-full flex flex-col items-center py-2 ${tab === key ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
            >
              <Icon />
              <span className="text-xs text-zinc-700">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
