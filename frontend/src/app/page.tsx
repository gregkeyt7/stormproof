"use client";

import { FormEvent, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ForensicsResponse = {
  profileId: string;
  analysisId: string;
  projection: {
    current: number;
    day45: number;
    month6: number;
    month12: number;
  };
  approvalRisk: {
    score: number;
    level: string;
  };
  suppressionBreakdown: Record<string, number>;
  fastestImpactActions: {
    title: string;
    reason: string;
    timeline: string;
    impactPoints: number;
  }[];
  lenderPerception: string[];
  aiSummary: string;
};

type DisputeLetterResponse = {
  caseId: string;
  letterId: string;
  letterType: string;
  subject: string;
  body: string;
  reviewReminder: string;
};

type SimulationResponse = {
  simulationId: string;
  projectedImpact: number;
  projectedScore: number;
  approvalOddsShift: string;
  lenderPerceptionShift: string;
  timelineBreakdown: {
    phase: string;
    score: number;
  }[];
  recommendations: string[];
};

type BusinessEvalResponse = {
  profileId: string;
  planId: string;
  fundingReadinessScore: number;
  lenderRiskScore: number;
  credibilityAnalysis: string[];
  vendorRecommendations: string[];
  sequencingPlan: {
    phase: string;
    action: string;
    rationale: string;
  }[];
  approvalOptimization: string[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const fadeIn = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" },
};

export default function Home() {
  const [token, setToken] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({
    name: "Alex",
    email: "alex@example.com",
    password: "SecurePass!234",
  });
  const [authStatus, setAuthStatus] = useState("");
  const [apiError, setApiError] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [forensics, setForensics] = useState<ForensicsResponse | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<{
    documentId: string;
    summary: {
      sourceType: string;
      estimatedScore: number | null;
      utilization: number | null;
      highRiskBehaviors: string[];
      accountMap: string[];
    };
  } | null>(null);
  const [disputeLetter, setDisputeLetter] = useState<DisputeLetterResponse | null>(
    null
  );
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [businessEval, setBusinessEval] = useState<BusinessEvalResponse | null>(
    null
  );

  const [analysisForm, setAnalysisForm] = useState({
    creditScore: 540,
    utilization: 78,
    latePayments: 4,
    collections: 2,
    inquiries: 5,
    oldestAccount: 2,
    annualIncome: 82000,
    goal: "businessGrowth",
    riskTolerance: "medium",
    businessAgeMonths: 9,
    businessRevenueMonthly: 12000,
    vendorTradelines: 2,
    hasEin: true,
    hasDuns: false,
    hasBusinessBank: true,
    context:
      "Need to improve profile before business vehicle financing and larger ad budget line.",
  });

  const [disputeForm, setDisputeForm] = useState({
    bureau: "EXPERIAN",
    creditorName: "Atlas Funding",
    accountType: "REVOLVING",
    issueType: "INACCURATE_LATE",
    userGoal: "Remove inaccurate 30-day late mark",
    evidence:
      "Bank statement shows payment posted before due date. Autopay confirmation attached.",
    escalationLevel: "BASIC",
  });

  const [simulationForm, setSimulationForm] = useState({
    debtPayoffAmount: 18000,
    utilizationTarget: 9,
    newAccounts: 0,
    inquiriesExpected: 1,
    limitIncrease: 7000,
    tradelineAdds: 1,
    balanceTransfer: 0,
  });

  const [businessForm, setBusinessForm] = useState({
    businessAgeMonths: 9,
    monthlyRevenue: 12000,
    vendorTradelines: 2,
    hasEin: true,
    hasDuns: false,
    hasBusinessBank: true,
    entityType: "LLC",
    objective: "Prepare for unsecured business lines and better lender profile.",
  });

  const chartData = useMemo(() => {
    if (!forensics) return [];
    return [
      { label: "Now", score: forensics.projection.current },
      { label: "45 Days", score: forensics.projection.day45 },
      { label: "6 Months", score: forensics.projection.month6 },
      { label: "12 Months", score: forensics.projection.month12 },
    ];
  }, [forensics]);

  const breakdownData = useMemo(() => {
    if (!forensics) return [];
    return Object.entries(forensics.suppressionBreakdown).map(([key, value]) => ({
      factor: key.replaceAll("_", " "),
      points: value,
    }));
  }, [forensics]);

  async function callApi<T>(
    endpoint: string,
    method: "GET" | "POST",
    payload?: unknown,
    isMultipart = false
  ): Promise<T> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!isMultipart) headers["Content-Type"] = "application/json";

    const response = await axios({
      baseURL: API_BASE_URL,
      url: endpoint,
      method,
      data: payload,
      headers,
    });

    return response.data as T;
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError("");
    setAuthStatus("Authenticating...");
    try {
      const endpoint =
        authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        authMode === "login"
          ? { email: authForm.email, password: authForm.password }
          : authForm;
      const response = await callApi<{ token: string; user: { email: string } }>(
        endpoint,
        "POST",
        payload
      );
      setToken(response.token);
      setAuthStatus(`Authenticated as ${response.user.email}`);
    } catch (error) {
      setAuthStatus("");
      setApiError(
        axios.isAxiosError(error)
          ? error.response?.data?.error ?? "Authentication failed."
          : "Authentication failed."
      );
    }
  }

  async function runForensics() {
    setAnalysisLoading(true);
    setApiError("");
    try {
      const response = await callApi<ForensicsResponse>(
        "/api/forensics/analyze",
        "POST",
        analysisForm
      );
      setForensics(response);
    } catch (error) {
      setApiError(
        axios.isAxiosError(error)
          ? error.response?.data?.error ?? "Unable to run analysis."
          : "Unable to run analysis."
      );
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function uploadDocument(file: File) {
    setApiError("");
    const formData = new FormData();
    formData.append("document", file);
    try {
      const response = await callApi<{
        documentId: string;
        summary: {
          sourceType: string;
          estimatedScore: number | null;
          utilization: number | null;
          highRiskBehaviors: string[];
          accountMap: string[];
        };
      }>("/api/uploads/documents", "POST", formData, true);
      setUploadedDoc(response);
    } catch (error) {
      setApiError(
        axios.isAxiosError(error)
          ? error.response?.data?.error ?? "Document parsing failed."
          : "Document parsing failed."
      );
    }
  }

  async function generateDisputeLetter() {
    setApiError("");
    try {
      const response = await callApi<DisputeLetterResponse>(
        "/api/disputes/letters/generate",
        "POST",
        disputeForm
      );
      setDisputeLetter(response);
    } catch (error) {
      setApiError(
        axios.isAxiosError(error)
          ? error.response?.data?.error ?? "Dispute generation failed."
          : "Dispute generation failed."
      );
    }
  }

  async function runSimulation() {
    setApiError("");
    try {
      const response = await callApi<SimulationResponse>(
        "/api/simulator/run",
        "POST",
        simulationForm
      );
      setSimulation(response);
    } catch (error) {
      setApiError(
        axios.isAxiosError(error)
          ? error.response?.data?.error ?? "Simulation failed."
          : "Simulation failed."
      );
    }
  }

  async function runBusinessEval() {
    setApiError("");
    try {
      const response = await callApi<BusinessEvalResponse>(
        "/api/business/evaluate",
        "POST",
        businessForm
      );
      setBusinessEval(response);
    } catch (error) {
      setApiError(
        axios.isAxiosError(error)
          ? error.response?.data?.error ?? "Business evaluation failed."
          : "Business evaluation failed."
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        <motion.section
          {...fadeIn}
          className="rounded-2xl border border-cyan-400/30 bg-slate-900/75 p-6 shadow-2xl shadow-cyan-900/20"
        >
          <p className="mb-3 inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-cyan-200">
            PERSONAL CREDIT TITAN AI - ULTRA INTELLIGENCE MODE
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Elite Private AI Financial Intelligence System
          </h1>
          <p className="mt-3 max-w-4xl text-sm text-slate-300 md:text-base">
            Underwriter logic + forensic analysis + dispute organization + business
            fundability sequencing. Designed for personal use only with lawful,
            factual, evidence-based optimization workflows.
          </p>
          <div className="mt-4 grid gap-2 text-xs text-slate-400 md:grid-cols-3">
            <p>• Not legal advice • Not a law firm • Not a public SaaS</p>
            <p>• Requires user review for all letters before sending</p>
            <p>• Never invents evidence, keeps all claims factual</p>
          </div>
        </motion.section>

        {apiError ? (
          <motion.div
            {...fadeIn}
            className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200"
          >
            {apiError}
          </motion.div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <motion.section
            {...fadeIn}
            className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5"
          >
            <h2 className="text-xl font-semibold">Secure Access Control</h2>
            <p className="mt-1 text-sm text-slate-400">
              JWT-backed private workspace access.
            </p>

            <form className="mt-4 space-y-3" onSubmit={handleAuthSubmit}>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`rounded-full border px-3 py-1 ${
                    authMode === "login"
                      ? "border-cyan-300 bg-cyan-400/20 text-cyan-100"
                      : "border-slate-700 text-slate-300"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className={`rounded-full border px-3 py-1 ${
                    authMode === "register"
                      ? "border-cyan-300 bg-cyan-400/20 text-cyan-100"
                      : "border-slate-700 text-slate-300"
                  }`}
                >
                  Register
                </button>
              </div>
              {authMode === "register" ? (
                <input
                  value={authForm.name}
                  onChange={(event) =>
                    setAuthForm((state) => ({ ...state, name: event.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                  placeholder="Name"
                />
              ) : null}
              <input
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm((state) => ({ ...state, email: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                placeholder="Email"
              />
              <input
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm((state) => ({
                    ...state,
                    password: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                placeholder="Password"
              />
              <button
                type="submit"
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
              >
                {authMode === "login" ? "Secure Login" : "Create Private User"}
              </button>
            </form>
            {authStatus ? (
              <p className="mt-3 text-xs text-emerald-300">{authStatus}</p>
            ) : null}
            {token ? (
              <p className="mt-1 text-xs text-slate-500">
                Token loaded. API calls are authorized.
              </p>
            ) : null}
          </motion.section>

          <motion.section
            {...fadeIn}
            className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5"
          >
            <h2 className="text-xl font-semibold">Credit Forensics Input</h2>
            <p className="mt-1 text-sm text-slate-400">
              Analyze suppression factors and generate high-impact sequencing.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                type="number"
                value={analysisForm.creditScore}
                onChange={(event) =>
                  setAnalysisForm((state) => ({
                    ...state,
                    creditScore: Number(event.target.value),
                  }))
                }
                placeholder="Credit score"
              />
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                type="number"
                value={analysisForm.utilization}
                onChange={(event) =>
                  setAnalysisForm((state) => ({
                    ...state,
                    utilization: Number(event.target.value),
                  }))
                }
                placeholder="Utilization"
              />
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                type="number"
                value={analysisForm.latePayments}
                onChange={(event) =>
                  setAnalysisForm((state) => ({
                    ...state,
                    latePayments: Number(event.target.value),
                  }))
                }
                placeholder="Late payments"
              />
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                type="number"
                value={analysisForm.collections}
                onChange={(event) =>
                  setAnalysisForm((state) => ({
                    ...state,
                    collections: Number(event.target.value),
                  }))
                }
                placeholder="Collections"
              />
            </div>

            <textarea
              className="mt-3 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={analysisForm.context}
              onChange={(event) =>
                setAnalysisForm((state) => ({ ...state, context: event.target.value }))
              }
              placeholder="Context and strategic goals"
            />

            <div className="mt-3 flex gap-2">
              <button
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
                onClick={runForensics}
                disabled={!token || analysisLoading}
              >
                {analysisLoading ? "Analyzing..." : "Run Forensics"}
              </button>
              <label className="cursor-pointer rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400">
                Upload Report
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.csv,.txt"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadDocument(file);
                  }}
                />
              </label>
            </div>

            {!token ? (
              <p className="mt-2 text-xs text-amber-300">
                Authenticate first to unlock analysis endpoints.
              </p>
            ) : null}
          </motion.section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <motion.section
            {...fadeIn}
            className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5"
          >
            <h2 className="text-xl font-semibold">Score Projection Intelligence</h2>
            {forensics ? (
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="label" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" domain={[300, 850]} />
                    <Tooltip />
                    <Area
                      dataKey="score"
                      stroke="#22d3ee"
                      fillOpacity={1}
                      fill="url(#scoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                Run forensics to see score trajectory simulation.
              </p>
            )}
            {forensics ? (
              <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-cyan-200">Approval Risk:</span>{" "}
                  {forensics.approvalRisk.level} ({forensics.approvalRisk.score}/100)
                </p>
                <p>
                  <span className="font-semibold text-cyan-200">AI Summary:</span>{" "}
                  {forensics.aiSummary}
                </p>
              </div>
            ) : null}
          </motion.section>

          <motion.section
            {...fadeIn}
            className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5"
          >
            <h2 className="text-xl font-semibold">Suppression Factor Breakdown</h2>
            {forensics ? (
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="factor" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="points" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                Upload or analyze a profile to populate suppression diagnostics.
              </p>
            )}
          </motion.section>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <motion.section
            {...fadeIn}
            className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 xl:col-span-2"
          >
            <h2 className="text-xl font-semibold">Fastest Impact Action Queue</h2>
            <div className="mt-3 space-y-2">
              {forensics?.fastestImpactActions?.length ? (
                forensics.fastestImpactActions.map((action) => (
                  <article
                    key={action.title}
                    className="rounded-lg border border-slate-700 bg-slate-950/80 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-cyan-200">
                        {action.title}
                      </h3>
                      <span className="rounded-full border border-cyan-400/30 px-2 py-0.5 text-xs text-cyan-100">
                        +{action.impactPoints} pts
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{action.reason}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-widest text-slate-500">
                      Timeline: {action.timeline}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-400">
                  No action queue yet. Run analysis to generate sequencing.
                </p>
              )}
            </div>
          </motion.section>

          <motion.section
            {...fadeIn}
            className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5"
          >
            <h2 className="text-xl font-semibold">OCR Intake Output</h2>
            {uploadedDoc ? (
              <div className="mt-3 space-y-2 text-xs text-slate-300">
                <p>Document ID: {uploadedDoc.documentId}</p>
                <p>Source Type: {uploadedDoc.summary.sourceType}</p>
                <p>
                  Estimated Score:{" "}
                  {uploadedDoc.summary.estimatedScore ?? "Not detected"}
                </p>
                <p>
                  Utilization:{" "}
                  {uploadedDoc.summary.utilization !== null
                    ? `${uploadedDoc.summary.utilization}%`
                    : "Not detected"}
                </p>
                <p className="font-semibold text-cyan-200">Detected Risks</p>
                <ul className="list-disc pl-5">
                  {uploadedDoc.summary.highRiskBehaviors.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                Upload a report, screenshot, PDF, or CSV to trigger OCR/NLP parsing.
              </p>
            )}
          </motion.section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <motion.section
            {...fadeIn}
            className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5"
          >
            <h2 className="text-xl font-semibold">Advanced Dispute Intelligence</h2>
            <p className="mt-1 text-sm text-slate-400">
              Generates bureau/creditor-focused letters for user review.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <select
                value={disputeForm.bureau}
                onChange={(event) =>
                  setDisputeForm((state) => ({ ...state, bureau: event.target.value }))
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="EXPERIAN">EXPERIAN</option>
                <option value="EQUIFAX">EQUIFAX</option>
                <option value="TRANSUNION">TRANSUNION</option>
              </select>
              <input
                value={disputeForm.creditorName}
                onChange={(event) =>
                  setDisputeForm((state) => ({
                    ...state,
                    creditorName: event.target.value,
                  }))
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                placeholder="Creditor name"
              />
              <select
                value={disputeForm.issueType}
                onChange={(event) =>
                  setDisputeForm((state) => ({ ...state, issueType: event.target.value }))
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="INACCURATE_LATE">Inaccurate late payment</option>
                <option value="DUPLICATE_ACCOUNT">Duplicate account reporting</option>
                <option value="UNKNOWN_ACCOUNT">Unknown account</option>
                <option value="PAID_COLLECTION_STILL_OPEN">
                  Paid collection still open
                </option>
              </select>
              <select
                value={disputeForm.escalationLevel}
                onChange={(event) =>
                  setDisputeForm((state) => ({
                    ...state,
                    escalationLevel: event.target.value,
                  }))
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="BASIC">Basic</option>
                <option value="ESCALATED">Escalated</option>
              </select>
            </div>
            <textarea
              value={disputeForm.userGoal}
              onChange={(event) =>
                setDisputeForm((state) => ({ ...state, userGoal: event.target.value }))
              }
              className="mt-2 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Goal"
            />
            <textarea
              value={disputeForm.evidence}
              onChange={(event) =>
                setDisputeForm((state) => ({ ...state, evidence: event.target.value }))
              }
              className="mt-2 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Evidence summary"
            />
            <button
              onClick={generateDisputeLetter}
              disabled={!token}
              className="mt-3 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
            >
              Generate Dispute Letter
            </button>
            {disputeLetter ? (
              <article className="mt-3 rounded-lg border border-slate-700 bg-slate-950/80 p-3 text-xs text-slate-300">
                <p className="font-semibold text-cyan-200">{disputeLetter.subject}</p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-5">
                  {disputeLetter.body}
                </pre>
                <p className="mt-2 text-[11px] text-amber-300">
                  {disputeLetter.reviewReminder}
                </p>
              </article>
            ) : null}
          </motion.section>

          <motion.section
            {...fadeIn}
            className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5"
          >
            <h2 className="text-xl font-semibold">AI Credit Simulator</h2>
            <p className="mt-1 text-sm text-slate-400">
              Simulate payoff, utilization, inquiries, and line strategy.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input
                value={simulationForm.debtPayoffAmount}
                onChange={(event) =>
                  setSimulationForm((state) => ({
                    ...state,
                    debtPayoffAmount: Number(event.target.value),
                  }))
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                type="number"
                placeholder="Debt payoff amount"
              />
              <input
                value={simulationForm.utilizationTarget}
                onChange={(event) =>
                  setSimulationForm((state) => ({
                    ...state,
                    utilizationTarget: Number(event.target.value),
                  }))
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                type="number"
                placeholder="Utilization target"
              />
              <input
                value={simulationForm.newAccounts}
                onChange={(event) =>
                  setSimulationForm((state) => ({
                    ...state,
                    newAccounts: Number(event.target.value),
                  }))
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                type="number"
                placeholder="New accounts"
              />
              <input
                value={simulationForm.limitIncrease}
                onChange={(event) =>
                  setSimulationForm((state) => ({
                    ...state,
                    limitIncrease: Number(event.target.value),
                  }))
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                type="number"
                placeholder="Limit increase"
              />
            </div>
            <button
              onClick={runSimulation}
              disabled={!token}
              className="mt-3 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
            >
              Run Lender Simulation
            </button>
            {simulation ? (
              <div className="mt-3 space-y-2 text-xs text-slate-300">
                <p>
                  Projected Impact:{" "}
                  <span className="font-semibold text-cyan-200">
                    +{simulation.projectedImpact} pts
                  </span>
                </p>
                <p>Projected Score: {simulation.projectedScore}</p>
                <p>Approval Odds Shift: {simulation.approvalOddsShift}</p>
                <p>{simulation.lenderPerceptionShift}</p>
              </div>
            ) : null}
          </motion.section>
        </div>

        <motion.section
          {...fadeIn}
          className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5"
        >
          <h2 className="text-xl font-semibold">Business Credit Domination Engine</h2>
          <p className="mt-1 text-sm text-slate-400">
            Evaluate fundability, optimize lender readiness, and build strategic
            sequencing.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <input
              value={businessForm.businessAgeMonths}
              onChange={(event) =>
                setBusinessForm((state) => ({
                  ...state,
                  businessAgeMonths: Number(event.target.value),
                }))
              }
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              type="number"
              placeholder="Business age months"
            />
            <input
              value={businessForm.monthlyRevenue}
              onChange={(event) =>
                setBusinessForm((state) => ({
                  ...state,
                  monthlyRevenue: Number(event.target.value),
                }))
              }
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              type="number"
              placeholder="Monthly revenue"
            />
            <input
              value={businessForm.vendorTradelines}
              onChange={(event) =>
                setBusinessForm((state) => ({
                  ...state,
                  vendorTradelines: Number(event.target.value),
                }))
              }
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              type="number"
              placeholder="Vendor tradelines"
            />
          </div>
          <textarea
            className="mt-2 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={businessForm.objective}
            onChange={(event) =>
              setBusinessForm((state) => ({ ...state, objective: event.target.value }))
            }
          />
          <button
            onClick={runBusinessEval}
            disabled={!token}
            className="mt-3 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
          >
            Run Business Credit Evaluation
          </button>

          {businessEval ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <article className="rounded-lg border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
                <p>
                  Funding Readiness:{" "}
                  <span className="font-semibold text-cyan-200">
                    {businessEval.fundingReadinessScore}/100
                  </span>
                </p>
                <p>
                  Lender Risk:{" "}
                  <span className="font-semibold text-cyan-200">
                    {businessEval.lenderRiskScore}/100
                  </span>
                </p>
                <p className="mt-2 font-semibold text-cyan-200">
                  Credibility Analysis
                </p>
                <ul className="mt-1 list-disc pl-5">
                  {businessEval.credibilityAnalysis.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="rounded-lg border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
                <p className="font-semibold text-cyan-200">
                  Approval Optimization Sequence
                </p>
                <ul className="mt-1 list-disc pl-5">
                  {businessEval.approvalOptimization.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          ) : null}
        </motion.section>

        <motion.section
          {...fadeIn}
          className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4 text-xs text-slate-300"
        >
          <p className="font-semibold text-cyan-100">Compliance Guardrails</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>All generated letters are drafts and require user verification.</li>
            <li>No fabricated claims, no fake documentation, no fraud automation.</li>
            <li>
              Outputs are educational strategy insights, not guaranteed score outcomes.
            </li>
          </ul>
        </motion.section>
      </main>
    </div>
  );
}
