"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Trash2, ArrowDown } from "lucide-react";
import axios from "axios";
import ChatBubble, { Message } from "./ChatBubble";
import { v4 as uuidv4 } from "uuid";

interface ChatWindowProps {
  isReady: boolean;
}

const SUGGESTED_QUESTIONS = [
  "What are the column names in this file?",
  "Summarize the key data points",
  "What is the total of the numeric columns?",
  "Are there any missing or null values?",
  "Show me the top 5 rows",
  "What trends can you identify?",
];

export default function ChatWindow({ isReady }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
    }
  }, [input]);

  // Show/hide scroll-to-bottom button
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim() || isLoading || !isReady) return;

      const userMsg: Message = {
        id: uuidv4(),
        role: "user",
        content: query.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      // Reset textarea height
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      try {
        const { data } = await axios.post(
          "http://localhost:8000/chat",
          { query: query.trim() },
          { timeout: 60000 }
        );

        const aiMsg: Message = {
          id: uuidv4(),
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (err: unknown) {
        const errMsg =
          axios.isAxiosError(err)
            ? err.response?.data?.detail ?? "Failed to reach the AI backend."
            : "Unexpected error. Please try again.";

        const errorMsg: Message = {
          id: uuidv4(),
          role: "assistant",
          content: `⚠️ ${errMsg}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, isReady]
  );

  const clearChat = () => {
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const showEmptyState = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header Bar */}
      {messages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-6 py-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles
              className="w-3.5 h-3.5"
              style={{ color: "var(--accent-light)" }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearChat}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-smooth"
            style={{
              color: "var(--text-muted)",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
            }}
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </motion.button>
        </motion.div>
      )}

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        <div className="py-6 px-6 space-y-5">
          {showEmptyState && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="flex flex-col items-center justify-center h-full min-h-[400px] gap-8"
            >
              {/* Hero Icon */}
              <div className="relative">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))",
                    border: "1px solid rgba(99,102,241,0.25)",
                    boxShadow: "0 0 80px rgba(99,102,241,0.15)",
                  }}
                >
                  <Sparkles
                    className="w-9 h-9"
                    style={{ color: "var(--accent-light)" }}
                  />
                </motion.div>
                {/* Pulse ring */}
                <div
                  className="absolute inset-0 rounded-3xl pulse-ring"
                  style={{ background: "rgba(99,102,241,0.06)" }}
                />
              </div>

              <div className="text-center max-w-sm">
                <h2
                  className="text-xl font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {isReady
                    ? "Ask anything about your data"
                    : "Upload an Excel file to get started"}
                </h2>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {isReady
                    ? "Your file has been indexed. Ask questions in plain English and get instant, AI-powered answers."
                    : "Drag and drop your .xlsx or .xls file in the sidebar to begin."}
                </p>
              </div>

              {/* Suggested Questions */}
              {isReady && (
                <div className="grid grid-cols-2 gap-2 w-full max-w-xl">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.06 }}
                      onClick={() => sendMessage(q)}
                      className="text-left px-4 py-3 rounded-xl text-[12px] glass-hover gradient-border group"
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span className="group-hover:text-[var(--text-primary)] transition-colors duration-200">
                        {q}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Keyboard shortcut hint */}
              {isReady && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Press{" "}
                  <kbd
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Enter
                  </kbd>{" "}
                  to send ·{" "}
                  <kbd
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Shift + Enter
                  </kbd>{" "}
                  for new line
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex gap-3 items-end"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))",
                    border: "1px solid rgba(99,102,241,0.25)",
                  }}
                >
                  <Sparkles
                    className="w-4 h-4 animate-pulse"
                    style={{ color: "#a78bfa" }}
                  />
                </div>
                <div
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-md"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full typing-dot"
                      style={{ background: "var(--accent-light)" }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={endRef} />
        </div>

        {/* Scroll to bottom FAB */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-10"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              <ArrowDown
                className="w-4 h-4"
                style={{ color: "var(--text-secondary)" }}
              />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input Area ── */}
      <div
        className="px-6 py-4 border-t"
        style={{
          borderColor: "var(--border)",
          background: "rgba(7,7,10,0.5)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          className="flex items-end gap-3 rounded-2xl px-4 py-3 input-glow"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border)",
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isReady || isLoading}
            placeholder={
              isReady
                ? "Ask a question about your Excel data…"
                : "Upload an Excel file first…"
            }
            className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed focus-ring"
            style={{
              color: "var(--text-primary)",
              caretColor: "var(--accent)",
            }}
          />

          <motion.button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading || !isReady}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-smooth"
            style={{
              background:
                input.trim() && isReady
                  ? "linear-gradient(135deg, var(--accent), var(--accent-light))"
                  : "rgba(255,255,255,0.04)",
              boxShadow:
                input.trim() && isReady
                  ? "0 0 16px rgba(99,102,241,0.3)"
                  : "none",
              cursor: input.trim() && isReady ? "pointer" : "not-allowed",
            }}
          >
            <Send
              className="w-4 h-4"
              style={{
                color:
                  input.trim() && isReady ? "#fff" : "var(--text-muted)",
              }}
            />
          </motion.button>
        </div>
        <p
          className="text-[10px] mt-2 text-center"
          style={{ color: "var(--text-muted)" }}
        >
          Answers grounded in your document via FAISS + Groq LLaMA 3.3
        </p>
      </div>
    </div>
  );
}
