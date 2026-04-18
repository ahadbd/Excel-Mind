"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Sparkles, ChevronDown, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
}

interface ChatBubbleProps {
  message: Message;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 pt-0.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={
            isUser
              ? {
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.25)",
                }
              : {
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))",
                  border: "1px solid rgba(99,102,241,0.25)",
                }
          }
        >
          {isUser ? (
            <User
              className="w-3.5 h-3.5"
              style={{ color: "var(--accent-light)" }}
            />
          ) : (
            <Sparkles className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className={`flex flex-col max-w-[80%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Label */}
        <p
          className="text-[10px] mb-1 font-medium tracking-wide uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          {isUser ? "You" : "ExcelMind AI"}
        </p>

        {/* Bubble */}
        <div
          className="rounded-2xl px-4 py-3 text-[13px] leading-relaxed group relative"
          style={
            isUser
              ? {
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  color: "var(--text-primary)",
                  borderTopRightRadius: "6px",
                }
              : {
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "var(--text-primary)",
                  borderTopLeftRadius: "6px",
                }
          }
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-ai">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}

          {/* Copy button (AI messages only) */}
          {!isUser && (
            <motion.button
              initial={{ opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-3 h-3" style={{ color: "#22c55e" }} />
              ) : (
                <Copy
                  className="w-3 h-3"
                  style={{ color: "var(--text-muted)" }}
                />
              )}
            </motion.button>
          )}
        </div>

        {/* Sources accordion */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <details className="mt-2 group/sources w-full">
            <summary
              className="flex items-center gap-1.5 text-[10px] cursor-pointer select-none transition-smooth"
              style={{ color: "var(--text-muted)" }}
            >
              <ChevronDown className="w-3 h-3 transition-transform duration-200 group-open/sources:rotate-180" />
              {message.sources.length} source
              {message.sources.length > 1 ? "s" : ""} referenced
            </summary>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1.5 flex flex-wrap gap-1"
            >
              {message.sources.map((src, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-1 rounded-lg"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    color: "var(--accent-light)",
                    border: "1px solid rgba(99,102,241,0.15)",
                  }}
                >
                  {src}
                </span>
              ))}
            </motion.div>
          </details>
        )}

        {/* Timestamp */}
        <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  );
}
