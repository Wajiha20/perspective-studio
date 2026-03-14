"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const SAMPLE_TRANSCRIPT = `Aisha: The pilot users loved the new onboarding flow and completion rates are up.
Rohan: That’s true for the pilot, but the sample size was tiny.
Meera: Engineering says we can ship this week if we skip the advanced permissions screen.
Rohan: Skipping that screen could create enterprise customer complaints.
Aisha: Sales needs something new for next Thursday’s demo.
Meera: We still have two unresolved bugs, but neither blocks the happy path.
Rohan: We have not tested edge cases for admin-managed accounts.`;

type DebateResult = {
  optimist: string;
  pessimist: string;
  moderator: string;
};

type HistoryItem = {
  id: string;
  transcript: string;
  question: string;
  result: DebateResult;
  suggestedQuestions: string[];
  createdAt: string;
};

type SidebarView = "new" | "history";
type ResultTab = "optimist" | "pessimist" | "moderator";

const HISTORY_KEY = "transcript-debate-history-v7";

const DEFAULT_SUGGESTED_QUESTIONS = [
  "What is the real takeaway?",
  "What risks are being ignored?",
  "Should the team ship this week?",
  "What evidence is missing?",
];

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M3 12a9 9 0 1 0 3-6.708"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Page() {
  const [sidebarView, setSidebarView] = useState<SidebarView>("new");
  const [activeTab, setActiveTab] = useState<ResultTab>("optimist");

  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [question, setQuestion] = useState("What is the real takeaway?");
  const [result, setResult] = useState<DebateResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    DEFAULT_SUGGESTED_QUESTIONS
  );

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as HistoryItem[];
      setHistory(parsed);
    } catch {
      localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  function persistHistory(next: HistoryItem[]) {
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }

  function saveHistory(item: HistoryItem) {
    const next = [item, ...history];
    persistHistory(next);
  }

  function deleteHistoryItem(id: string) {
    const next = history.filter((item) => item.id !== id);
    persistHistory(next);
  }

  function clearHistory() {
    persistHistory([]);
  }

  function handleNewAnalysis() {
    setTranscript("");
    setQuestion("");
    setResult(null);
    setError("");
    setActiveTab("optimist");
    setSidebarView("new");
    setSuggestedQuestions(DEFAULT_SUGGESTED_QUESTIONS);
  }

  function loadHistoryItem(item: HistoryItem) {
    setTranscript(item.transcript);
    setQuestion(item.question);
    setResult(item.result);
    setSuggestedQuestions(
      item.suggestedQuestions?.length
        ? item.suggestedQuestions
        : DEFAULT_SUGGESTED_QUESTIONS
    );
    setActiveTab("optimist");
    setError("");
    setSidebarView("new");

    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
  }

  function inferSuggestedQuestions(rawTranscript: string) {
    const lower = rawTranscript.toLowerCase();
    const suggestions: string[] = [];

    if (
      lower.includes("ship") ||
      lower.includes("launch") ||
      lower.includes("release")
    ) {
      suggestions.push("Should the team ship this now?");
    }

    if (
      lower.includes("risk") ||
      lower.includes("bug") ||
      lower.includes("complaint") ||
      lower.includes("untested")
    ) {
      suggestions.push("What are the biggest risks in this transcript?");
    }

    if (
      lower.includes("agree") ||
      lower.includes("disagree") ||
      lower.includes("but") ||
      lower.includes("however")
    ) {
      suggestions.push("Where do the speakers disagree most?");
    }

    if (
      lower.includes("customer") ||
      lower.includes("users") ||
      lower.includes("pilot")
    ) {
      suggestions.push("What does this transcript imply about customer impact?");
    }

    suggestions.push(
      "What is the real takeaway?",
      "What evidence is missing?",
      "Who seems most cautious in this discussion?"
    );

    return Array.from(new Set(suggestions)).slice(0, 4);
  }

  async function runDebate() {
    setLoading(true);
    setError("");
    setResult(null);
    setActiveTab("optimist");
    setSidebarView("new");
    setLoadingMessage("Reading transcript...");
    setProgress(5);

    const messages = [
      "Reading transcript...",
      "Finding key evidence...",
      "Building Optimist answer...",
      "Building Pessimist answer...",
      "Moderator is comparing both sides...",
      "Finalizing response...",
    ];

    let progressValue = 5;
    let messageIndex = 0;

    const progressTimer = window.setInterval(() => {
      progressValue = Math.min(progressValue + Math.random() * 9, 93);
      setProgress(Math.floor(progressValue));
    }, 700);

    const messageTimer = window.setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingMessage(messages[messageIndex]);
    }, 1600);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      const nextSuggestions = inferSuggestedQuestions(transcript);

      setProgress(100);
      setResult(data);
      setSuggestedQuestions(nextSuggestions);

      const historyItem: HistoryItem = {
        id: crypto.randomUUID(),
        transcript,
        question,
        result: data,
        suggestedQuestions: nextSuggestions,
        createdAt: new Date().toLocaleString(),
      };

      saveHistory(historyItem);

      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      window.clearInterval(progressTimer);
      window.clearInterval(messageTimer);

      window.setTimeout(() => {
        setLoading(false);
        setLoadingMessage("");
        setProgress(0);
      }, 500);
    }
  }

  function exportDebate() {
    if (!result) return;

    const content = `Perspective Studio

Question:
${question}

Transcript:
${transcript}

Optimist:
${result.optimist}

Pessimist:
${result.pessimist}

Moderator:
${result.moderator}
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `perspective-studio-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  const activeTabLabel = useMemo(() => {
    if (activeTab === "optimist") return "Optimist";
    if (activeTab === "pessimist") return "Pessimist";
    return "Moderator";
  }, [activeTab]);

  function renderResultCard() {
    if (!result) {
      return (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-slate-400">
          Your selected result will appear here. Paste a transcript, ask a
          question, and run the debate.
        </div>
      );
    }

    if (activeTab === "optimist") {
      return (
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6 shadow-[0_0_0_1px_rgba(16,185,129,0.06)]">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            <h3 className="text-lg font-semibold text-emerald-200">Optimist</h3>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-100">
            {result.optimist}
          </p>
        </div>
      );
    }

    if (activeTab === "pessimist") {
      return (
        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-6 shadow-[0_0_0_1px_rgba(251,191,36,0.06)]">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <h3 className="text-lg font-semibold text-amber-200">Pessimist</h3>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-100">
            {result.pessimist}
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 shadow-[0_0_0_1px_rgba(34,211,238,0.06)]">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
          <h3 className="text-lg font-semibold text-cyan-200">Moderator</h3>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-100">
          {result.moderator}
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5">
          <div className="max-w-[78%] rounded-[26px] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Perspective Studio
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Analyze transcripts, ask sharper questions, and compare competing
              interpretations in one workspace.
            </p>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-8rem)] gap-4 lg:grid-cols-[170px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl">
            <div className="pt-2">
              <nav className="space-y-2">
                <button
                  onClick={handleNewAnalysis}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition ${
                    sidebarView === "new"
                      ? "bg-cyan-400 text-black"
                      : "bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/10">
                    <PlusIcon />
                  </span>
                  <span className="font-medium">New</span>
                </button>

                <button
                  onClick={() => setSidebarView("history")}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition ${
                    sidebarView === "history"
                      ? "bg-cyan-400 text-black"
                      : "bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/10">
                    <HistoryIcon />
                  </span>
                  <span className="font-medium">History</span>
                </button>
              </nav>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-[#0e1529] p-3">
              {sidebarView === "history" ? (
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-white">History</h2>
                    <button
                      onClick={clearHistory}
                      disabled={history.length === 0}
                      className="rounded-xl bg-red-500/15 px-2 py-1 text-[11px] text-red-200 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </div>

                  {history.length === 0 ? (
                    <p className="text-sm leading-6 text-slate-400">
                      No saved debates yet.
                    </p>
                  ) : (
                    <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                        >
                          <button
                            onClick={() => loadHistoryItem(item)}
                            className="w-full text-left"
                          >
                            <div className="mb-1 text-[11px] text-slate-500">
                              {item.createdAt}
                            </div>
                            <div className="line-clamp-2 text-sm font-medium text-white">
                              {item.question}
                            </div>
                            <div className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
                              {item.transcript}
                            </div>
                          </button>

                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => loadHistoryItem(item)}
                              className="flex-1 rounded-xl bg-cyan-500/15 px-3 py-2 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/25"
                            >
                              Open
                            </button>
                            <button
                              onClick={() => deleteHistoryItem(item.id)}
                              className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/25"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h2 className="mb-2 text-sm font-semibold text-white">
                    Workspace
                  </h2>
                  <p className="text-sm leading-6 text-slate-400">
                    Analyze transcripts and compare perspectives side by side.
                  </p>
                </div>
              )}
            </div>
          </aside>

          <section className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
                <div className="rounded-[28px] border border-white/10 bg-[#0e1529] p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">Transcript</h3>
                    <button
                      onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}
                      className="rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
                    >
                      Load Sample
                    </button>
                  </div>

                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={18}
                    placeholder="Paste any meeting, interview, customer call, or discussion transcript here..."
                    className="w-full rounded-[24px] border border-white/10 bg-[#0b1020] p-4 text-sm leading-6 text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                <div className="rounded-[28px] border border-white/10 bg-[#0e1529] p-5">
                  <h3 className="mb-3 text-lg font-semibold">Question</h3>

                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={6}
                    placeholder="Ask anything about the transcript..."
                    className="w-full rounded-[24px] border border-white/10 bg-[#0b1020] p-4 text-sm leading-6 text-white outline-none placeholder:text-slate-500"
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      onClick={runDebate}
                      disabled={loading || !transcript.trim() || !question.trim()}
                      className="rounded-2xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Getting answers..." : "Run Debate"}
                    </button>

                    {result ? (
                      <button
                        onClick={exportDebate}
                        disabled={loading}
                        className="rounded-2xl bg-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Export Debate
                      </button>
                    ) : null}
                  </div>

                  {loading ? (
                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm text-cyan-300">{loadingMessage}</p>
                        <p className="text-xs text-slate-400">{progress}%</p>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Preparing {activeTabLabel.toLowerCase()}-style reasoning
                        and final synthesis.
                      </p>
                    </div>
                  ) : null}

                  {error ? (
                    <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
                      {error}
                    </div>
                  ) : null}

                  <div className="mt-6">
                    <h4 className="mb-3 text-sm font-semibold text-slate-200">
                      Suggested Questions
                    </h4>

                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((item) => (
                        <button
                          key={item}
                          onClick={() => setQuestion(item)}
                          className="rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-sm text-slate-200 transition hover:bg-white/[0.1]"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <section
              ref={resultsRef}
              className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Debate Results</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Switch between competing interpretations and the final
                    synthesis.
                  </p>
                </div>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("optimist")}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === "optimist"
                      ? "bg-emerald-400 text-black"
                      : "bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]"
                  }`}
                >
                  Optimist
                </button>

                <button
                  onClick={() => setActiveTab("pessimist")}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === "pessimist"
                      ? "bg-amber-400 text-black"
                      : "bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]"
                  }`}
                >
                  Pessimist
                </button>

                <button
                  onClick={() => setActiveTab("moderator")}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === "moderator"
                      ? "bg-cyan-400 text-black"
                      : "bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]"
                  }`}
                >
                  Moderator
                </button>
              </div>

              {renderResultCard()}
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}