"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  FileSpreadsheet,
  Table2,
  Rows3,
} from "lucide-react";
import axios from "axios";

interface UploadResult {
  filename: string;
  rows_processed: number;
  sheets: string[];
}

interface FileUploaderProps {
  onUploadSuccess: (result: UploadResult) => void;
  onReset: () => void;
  uploadedFile: UploadResult | null;
}

export default function FileUploader({
  onUploadSuccess,
  onReset,
  uploadedFile,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        setError("Only Excel files (.xlsx, .xls) are supported.");
        return;
      }

      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const { data } = await axios.post<UploadResult>(
          "http://localhost:8000/upload",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 120000,
            onUploadProgress: (e) => {
              if (e.total) {
                setUploadProgress(Math.round((e.loaded / e.total) * 100));
              }
            },
          }
        );
        onUploadSuccess(data);
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.detail ??
            "Upload failed. Is the backend running?"
          : "Unexpected error during upload.";
        setError(message);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [onUploadSuccess]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleReset = async () => {
    try {
      await axios.post("http://localhost:8000/reset");
    } catch {
      /* ignore */
    }
    onReset();
  };

  // ── Uploaded State ──
  if (uploadedFile) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl overflow-hidden"
      >
        {/* Success header bar */}
        <div
          className="flex items-center gap-2 px-4 py-2.5"
          style={{
            background: "rgba(34,197,94,0.06)",
            borderBottom: "1px solid rgba(34,197,94,0.1)",
          }}
        >
          <CheckCircle2 className="w-4 h-4" style={{ color: "#22c55e" }} />
          <span
            className="text-[11px] font-semibold"
            style={{ color: "#22c55e" }}
          >
            Indexed Successfully
          </span>
          <div className="flex-1" />
          <motion.button
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.4 }}
            onClick={handleReset}
            className="p-1.5 rounded-lg transition-smooth"
            style={{ color: "var(--text-muted)" }}
            title="Upload a new file"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* File info */}
        <div className="p-4 flex flex-col gap-3">
          {/* Filename */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <FileSpreadsheet
                className="w-5 h-5"
                style={{ color: "var(--accent-light)" }}
              />
            </div>
            <div className="min-w-0">
              <p
                className="font-semibold text-[13px] truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {uploadedFile.filename}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border)",
              }}
            >
              <Rows3
                className="w-3.5 h-3.5"
                style={{ color: "var(--accent-light)" }}
              />
              <div>
                <p
                  className="text-[11px] font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {uploadedFile.rows_processed.toLocaleString()}
                </p>
                <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                  Rows
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border)",
              }}
            >
              <Table2
                className="w-3.5 h-3.5"
                style={{ color: "var(--accent-light)" }}
              />
              <div>
                <p
                  className="text-[11px] font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {uploadedFile.sheets.length}
                </p>
                <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                  Sheets
                </p>
              </div>
            </div>
          </div>

          {/* Sheet chips */}
          <div className="flex flex-wrap gap-1.5">
            {uploadedFile.sheets.map((s, i) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: "rgba(99,102,241,0.1)",
                  color: "var(--accent-light)",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
                {s}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Upload Zone ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) =>
          e.target.files?.[0] && handleFile(e.target.files[0])
        }
      />

      <motion.div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging
            ? "rgba(99,102,241,0.7)"
            : "rgba(255,255,255,0.08)",
          background: isDragging
            ? "rgba(99,102,241,0.06)"
            : "rgba(255,255,255,0.015)",
        }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-3 cursor-pointer group"
        style={{ minHeight: "140px" }}
      >
        {/* Glow overlay on drag */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                boxShadow: "inset 0 0 50px rgba(99,102,241,0.12)",
              }}
            />
          )}
        </AnimatePresence>

        {isUploading ? (
          <>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.08)" }}
            >
              <Loader2
                className="w-6 h-6 animate-spin"
                style={{ color: "var(--accent)" }}
              />
            </div>
            <div className="text-center">
              <p
                className="font-semibold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Processing your file…
              </p>
              <p
                className="text-[11px] mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Embedding into FAISS vector store
              </p>
            </div>
            {/* Upload progress bar */}
            {uploadProgress > 0 && (
              <div
                className="w-full h-1 rounded-full overflow-hidden mt-1"
                style={{ background: "var(--border)" }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--accent), var(--accent-light))",
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <motion.div
              whileHover={{ scale: 1.08, y: -2 }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-smooth"
              style={{
                background: isDragging
                  ? "rgba(99,102,241,0.15)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  isDragging
                    ? "rgba(99,102,241,0.35)"
                    : "rgba(255,255,255,0.07)"
                }`,
              }}
            >
              <Upload
                className="w-5 h-5 transition-colors duration-300"
                style={{
                  color: isDragging ? "var(--accent)" : "var(--text-secondary)",
                }}
              />
            </motion.div>

            <div className="text-center">
              <p
                className="font-semibold text-[13px]"
                style={{ color: "var(--text-primary)" }}
              >
                {isDragging ? "Release to upload" : "Drop your Excel file here"}
              </p>
              <p
                className="text-[11px] mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                or{" "}
                <span
                  className="underline underline-offset-2 cursor-pointer transition-colors"
                  style={{ color: "var(--accent-light)" }}
                >
                  browse from your computer
                </span>
              </p>
              <p
                className="text-[10px] mt-2 font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                .xlsx · .xls supported
              </p>
            </div>
          </>
        )}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-center gap-2.5 rounded-xl px-4 py-3"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            <AlertCircle
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "#ef4444" }}
            />
            <p className="text-[11px] flex-1" style={{ color: "#fca5a5" }}>
              {error}
            </p>
            <button onClick={() => setError(null)}>
              <X className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
