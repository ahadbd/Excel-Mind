"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  Zap,
  Database,
  Brain,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import FileUploader from "@/components/FileUploader";
import ChatWindow from "@/components/ChatWindow";

interface UploadResult {
  filename: string;
  rows_processed: number;
  sheets: string[];
}

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null);

  const handleReset = () => setUploadedFile(null);

  return (
    <div className="relative min-h-screen h-screen flex flex-col overflow-hidden">
      {/* Aurora Background */}
      <div className="aurora-bg" />

      {/* ── Header ── */}
      <header className="header-glass relative z-10 flex items-center justify-between px-5 py-3">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
              boxShadow: "0 0 24px rgba(99,102,241,0.35)",
            }}
          >
            <FileSpreadsheet className="w-[18px] h-[18px] text-white" />
          </motion.div>
          <div>
            <h1
              className="text-[15px] font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              ExcelMind
            </h1>
            <p
              className="text-[10px] tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              AI-Powered Spreadsheet Analysis
            </p>
          </div>
        </div>

        {/* Center: Tech Pills */}
        <div className="hidden md:flex items-center gap-1.5">
          {[
            { icon: <Zap className="w-3 h-3" />, label: "Groq LLaMA 3.3" },
            { icon: <Database className="w-3 h-3" />, label: "FAISS" },
            { icon: <Brain className="w-3 h-3" />, label: "LangChain RAG" },
          ].map(({ icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-medium transition-smooth"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "var(--text-muted)",
              }}
            >
              <span style={{ color: "var(--accent-light)" }}>{icon}</span>
              {label}
            </span>
          ))}
        </div>

        {/* Right: Status */}
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={uploadedFile ? "ready" : "waiting"}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: uploadedFile ? "#22c55e" : "var(--text-muted)",
                  }}
                />
                {uploadedFile && (
                  <div className="absolute inset-0 w-2 h-2 rounded-full status-dot-active" />
                )}
              </div>
              <span
                className="text-[11px] font-medium"
                style={{
                  color: uploadedFile
                    ? "var(--text-secondary)"
                    : "var(--text-muted)",
                }}
              >
                {uploadedFile ? "Index Ready" : "Awaiting Upload"}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row min-h-0">
        {/* ── Left Sidebar ── */}
        <aside
          className="lg:w-[320px] flex-shrink-0 flex flex-col gap-5 p-5 border-r overflow-y-auto"
          style={{
            borderColor: "var(--border)",
            background: "rgba(255,255,255,0.01)",
          }}
        >
          {/* Section: Document */}
          <div>
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Document
            </h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Upload a spreadsheet to begin the AI analysis pipeline.
            </p>
          </div>

          {/* File Uploader */}
          <FileUploader
            onUploadSuccess={setUploadedFile}
            onReset={handleReset}
            uploadedFile={uploadedFile}
          />

          {/* Divider */}
          <div
            className="border-t"
            style={{ borderColor: "var(--border)" }}
          />

          {/* How It Works */}
          <div>
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              How It Works
            </h2>
            <div className="flex flex-col gap-3">
              {[
                {
                  step: "01",
                  title: "Upload Excel",
                  desc: "Your file is parsed row-by-row into structured text documents.",
                  color: "#6366f1",
                },
                {
                  step: "02",
                  title: "Vector Embedding",
                  desc: "Each row is embedded using HuggingFace sentence-transformers into FAISS.",
                  color: "#8b5cf6",
                },
                {
                  step: "03",
                  title: "Semantic Search",
                  desc: "Your query is matched against the most relevant rows in vector space.",
                  color: "#a855f7",
                },
                {
                  step: "04",
                  title: "LLM Generation",
                  desc: "Retrieved context is sent to Groq's LLaMA 3.3 for a precise answer.",
                  color: "#c084fc",
                },
              ].map(({ step, title, desc, color }, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + 0.08 * i, duration: 0.4 }}
                  className="flex gap-3 group"
                >
                  {/* Step number badge */}
                  <span
                    className="flex-shrink-0 text-[9px] font-bold mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-smooth"
                    style={{
                      background: `${color}15`,
                      color: color,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    {step}
                  </span>
                  <div>
                    <p
                      className="text-[12px] font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {title}
                    </p>
                    <p
                      className="text-[11px] mt-0.5 leading-relaxed"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Spacer to push footer down */}
          <div className="flex-1" />

          {/* Sidebar Footer */}
          <div
            className="text-center py-3 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <p
              className="text-[10px]"
              style={{ color: "var(--text-muted)" }}
            >
              Built with LangChain · FAISS · Groq
            </p>
          </div>
        </aside>

        {/* ── Chat Panel ── */}
        <section className="flex-1 flex flex-col min-h-0 min-w-0">
          <ChatWindow isReady={!!uploadedFile} />
        </section>
      </main>
    </div>
  );
}
