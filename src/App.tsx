import { createPortal } from "react-dom";
import React, { useEffect, useMemo, useRef, useState } from "react";
import donut from "./assets/logo-donut.png";
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
    <div className="min-h-[100svh] w-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-zinc-50 to-emerald-50 px-5">
      {/* 메인 카드 */}
      <div className="relative w-full max-w-[390px] h-[100svh] bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-zinc-200 flex flex-col">
        <Header lang={lang} setLang={setLang} email={email} onLogout={onLogout} />
  
        {/* 콘텐츠만 스크롤 */}
        <main className="flex-1 overflow-y-auto overscroll-y-contain px-5 p-4">
          {tab === "chat" ? (
            <Chat t={t} />
          ) : tab === "today" ? (
            <Today t={t} />
          ) : (
            <History t={t} />
          )}
        </main>
  
        {/* ✅ 카드 하단 고정 탭바 (일반 흐름) */}
        <TabBar t={t} tab={tab} setTab={setTab} />
      </div>
    </div>
  );
}

// ---------------- Header ----------------
type HeaderProps = {
  lang: "ko" | "en";
  setLang: React.Dispatch<React.SetStateAction<"ko" | "en">>;
  email: string | null;
  onLogout: () => void;
};

const Header: React.FC<HeaderProps> = ({ lang, setLang, email, onLogout }) => {
  return (
    <header className="flex items-start gap-2.5 px-5 py-3 border-b border-slate-200 rounded-t-3xl bg-white">
      {/* 왼쪽: 도넛 아이콘 */}
      <img
        src={donut}
        alt="No Regret logo"
        className="h-6 w-6 mt-[2px] object-contain"
      />

      {/* 가운데: 2줄 카피 */}
      <div className="leading-tight">
        <div className="text-[20px] font-semibold tracking-tight text-slate-900">
          no - regret
        </div>
        <div className="text-[13px] text-slate-500">
          완벽한 사람들을 위하여
        </div>
      </div>

      {/* 오른쪽: 언어 토글 + (로그인 시) 로그아웃 */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setLang(lang === "ko" ? "en" : "ko")}
          className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
          aria-label="Change language"
        >
          {lang.toUpperCase()}
        </button>
        {email && (
          <button
            onClick={onLogout}
            className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            {lang === "ko" ? "로그아웃" : "Log out"}
          </button>
        )}
      </div>
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
type Profile = { email: string | null; nick: string | null };
type ChatMsg = { email: string | null; nick: string; text: string; ts: number };

const LS_PROFILE = "nr_profile_v1";
const MAX_LEN = 200;
const TTL_MS = 10 * 60 * 1000; // 10분

function Chat({ t }: { t: any }) {
  const [profile, setProfile] = useState<Profile>(() => {
    const raw = localStorage.getItem(LS_PROFILE);
    if (!raw) return { email: null, nick: null };
    try {
      const p = JSON.parse(raw);
      // 과거 포맷 호환(email만 저장했던 경우)
      if (typeof p === "string") return { email: p, nick: null };
      return { email: p.email ?? null, nick: p.nick ?? null };
    } catch {
      return { email: null, nick: null };
    }
  });

  const displayName = (profile.nick?.trim() || "익명의 도넛").slice(0, 10);

  // 메시지: 오래된 것부터(상단) → 새로 추가하면 배열 끝에 push
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => {
    const raw = localStorage.getItem(LS_MSGS);
    if (!raw) return [];
    try {
      const arr: ChatMsg[] = JSON.parse(raw);
      const now = Date.now();
      return arr.filter((m) => now - m.ts <= TTL_MS);
    } catch {
      return [];
    }
  });

  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const chRef = useRef<BroadcastChannel | null>(null);

  // 브로드캐스트 채널 연결
  useEffect(() => {
    chRef.current = new BroadcastChannel("nr_chat");
    chRef.current.onmessage = (ev) => {
      const m: ChatMsg = ev.data;
      setMsgs((prev) => [...prev, m]); // 배열 끝에 추가(= 아래쪽으로 쌓임)
    };
    return () => chRef.current?.close();
  }, []);

  // 저장 + 자동 스크롤 + TTL 정리
  useEffect(() => {
    const now = Date.now();
    const pruned = msgs.filter((m) => now - m.ts <= TTL_MS);
    if (pruned.length !== msgs.length) setMsgs(pruned);
    localStorage.setItem(LS_MSGS, JSON.stringify(pruned));

    // 아래로 자동 스크롤
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs]);

  // 주기적 TTL 정리
  useEffect(() => {
    const id = setInterval(() => {
      setMsgs((prev) => {
        const now = Date.now();
        const pruned = prev.filter((m) => now - m.ts <= TTL_MS);
        if (pruned.length !== prev.length) localStorage.setItem(LS_MSGS, JSON.stringify(pruned));
        return pruned;
      });
    }, 15_000);
    return () => clearInterval(id);
  }, []);

  // 프로필 모달
  const [showProfile, setShowProfile] = useState(false);
  const [editEmail, setEditEmail] = useState(profile.email ?? "");
  const [editNick, setEditNick] = useState(profile.nick ?? "");

  const openProfile = () => {
    setEditEmail(profile.email ?? "");
    setEditNick(profile.nick ?? "");
    setShowProfile(true);
  };

  const saveProfile = () => {
    const next: Profile = {
      email: editEmail.trim() || null,
      nick: (editNick || "").trim().slice(0, 10) || null,
    };
    setProfile(next);
    localStorage.setItem(LS_PROFILE, JSON.stringify(next));
    setShowProfile(false);
  };

  const send = () => {
    const t2 = text.trim().slice(0, MAX_LEN);
    if (!t2) return;
    const m: ChatMsg = { email: profile.email, nick: displayName, text: t2, ts: Date.now() };
    setMsgs((prev) => [...prev, m]);
    chRef.current?.postMessage(m);
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* 상단 타이틀 고정 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 py-2 mb-2">
        <div className="text-[13px] text-slate-600 px-1">오늘 하루 행복한 사람만 채팅하기</div>
      </div>

      {/* 채팅 리스트 */}
      <div ref={listRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
        {msgs.map((m, i) => (
          <div key={i} className="flex items-start gap-2">
            <img src={donut} alt="" className="h-5 w-5 mt-0.5 object-contain" />
            <div>
              <div className="text-[11px] text-slate-500">{m.nick || "익명의 도넛"}</div>
              <div className="inline-block max-w-[260px] rounded-full border px-3 py-1 text-sm bg-white">
                {m.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 내 정보(닉네임 라벨) + 입력 */}
      <div className="mt-3">
        <button
          onClick={openProfile}
          className="text-xs text-slate-500 mb-1 hover:underline"
          aria-label="프로필 설정"
        >
          {displayName}
        </button>

        <div className="flex items-center gap-2 p-2 rounded-2xl border bg-white shadow-sm">
          <img src={donut} alt="" className="h-6 w-6 object-contain" onClick={openProfile} />
          <input
            className="flex-1 px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-300"
            placeholder={t.chatPlaceholder}
            value={text}
            maxLength={MAX_LEN}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button className="px-4 py-2 rounded-xl bg-zinc-900 text-white" onClick={send}>
            Send
          </button>
        </div>

        <div className="mt-1 text-[11px] text-slate-400 text-right">{text.length}/{MAX_LEN}</div>
      </div>

      {/* 프로필 모달 (이메일 + 닉네임) */}
      {showProfile &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center p-6">
            <div className="w-full max-w-[360px] rounded-2xl bg-white border shadow-xl p-4">
              <div className="text-sm font-medium text-slate-800 mb-3">내 정보</div>
              <label className="block text-xs text-slate-500 mb-1">이메일</label>
              <input
                className="w-full px-3 py-2 rounded-xl border mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="email@example.com"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
              <label className="block text-xs text-slate-500 mb-1">닉네임 (최대 10자)</label>
              <input
                className="w-full px-3 py-2 rounded-xl border mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="닉네임"
                maxLength={10}
                value={editNick}
                onChange={(e) => setEditNick(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button className="px-3 py-1.5 rounded-lg border" onClick={() => setShowProfile(false)}>취소</button>
                <button className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white" onClick={saveProfile}>저장</button>
              </div>
            </div>
          </div>,
          document.body
        )}
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
console.log("TabBar rendered");

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
    <nav className="h-16 shrink-0 flex items-center bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-6px_14px_rgba(0,0,0,0.06)] rounded-b-3xl pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto w-full grid grid-cols-3 gap-0 px-3">
        {tabs.map(({ key, label, Icon }) => {
          const selected = tab === key;
          return (
            <li key={key} className="flex justify-center">
              <button
                onClick={() => setTab(key)}
                className={`w-full max-w-[110px] flex items-center justify-center gap-2 py-2 rounded-2xl transition
                  ${selected ? "bg-violet-100 shadow-sm" : "hover:bg-slate-100"}`}
              >
                <Icon />
                <span className="text-xs text-zinc-800">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
