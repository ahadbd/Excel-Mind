import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExcelMind — AI-Powered Excel Analysis",
  description:
    "Upload your Excel spreadsheets and ask questions in plain language. Powered by Groq LLaMA 3 and FAISS vector search.",
  keywords: ["Excel AI", "RAG", "FAISS", "Groq", "Data Analysis", "AI Chat"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
