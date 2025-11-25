"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/supabaseBrowser";

type Step = "auth" | "upload" | "analyzing" | "complete";

export default function AnalyzePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("auth");
  const [chatText, setChatText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { user, error } = await getUser();
      if (error || !user) {
        router.push("/auth");
      } else {
        setStep("upload");
      }
    };
    checkAuth();
  }, [router]);

  const handleAnalyze = async () => {
    if (!chatText.trim() || loading) return;

    setLoading(true);
    setError(null);
    setStep("analyzing");
    setProgress(0);

    try {
      // Step 1: Create conversation
      setProgress(10);
      const createRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Analysis ${new Date().toLocaleDateString()}`,
        }),
      });

      if (!createRes.ok) {
        throw new Error("Failed to create conversation");
      }

      const { conversation } = await createRes.json();
      setConversationId(conversation.id);
      setProgress(30);

      // Step 2: Upload messages
      const messagesRes = await fetch(
        `/api/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawText: chatText }),
        }
      );

      if (!messagesRes.ok) {
        throw new Error("Failed to parse messages");
      }
      setProgress(60);

      // Step 3: Generate summary
      const summaryRes = await fetch(
        `/api/conversations/${conversation.id}/summary`,
        {
          method: "POST",
        }
      );

      if (!summaryRes.ok) {
        throw new Error("Failed to generate summary");
      }
      setProgress(100);

      // Complete
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: "upload", label: "Upload" },
    { id: "analyzing", label: "Analyze" },
    { id: "complete", label: "Complete" },
  ];

  const currentStepIndex = steps.findIndex(
    (s) => s.id === step || (step === "auth" && s.id === "upload")
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Noise */}
      <div className="noise" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-6 md:px-12 py-6 border-b border-[var(--border)]"
      >
        <nav className="flex items-center justify-between">
          <Link href="/" className="font-medium tracking-tight">
            TOXIC©
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </nav>
      </motion.header>

      {/* Progress indicator */}
      <div className="px-6 md:px-12 py-8 border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`w-10 h-10 flex items-center justify-center border transition-colors ${
                    i <= currentStepIndex
                      ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]"
                      : "border-[var(--border)] text-[var(--text-muted)]"
                  }`}
                >
                  {i < currentStepIndex ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm">{i + 1}</span>
                  )}
                </motion.div>
                {i < steps.length - 1 && (
                  <div className="w-20 md:w-32 h-px bg-[var(--border)] mx-2">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: i < currentStepIndex ? 1 : 0,
                      }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="h-full bg-[var(--text)] origin-left"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={`text-xs ${
                  i <= currentStepIndex
                    ? "text-[var(--text)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 px-6 md:px-12 py-12">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {step === "auth" && (
              <motion.div
                key="auth"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-20"
              >
                <Loader2 className="w-6 h-6 animate-spin" />
              </motion.div>
            )}

            {step === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-8">
                  <span className="text-sm tracking-widest text-[var(--text-muted)] uppercase block mb-4">
                    Step 1
                  </span>
                  <h1 className="text-4xl md:text-5xl font-light tracking-tight">
                    Paste your
                    <br />
                    <span className="italic">chat history</span>
                  </h1>
                </div>

                <p className="text-[var(--text-muted)] mb-8">
                  Copy and paste your LINE, Messenger, or WhatsApp chat export.
                  We&apos;ll analyze the toxicity levels automatically.
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-500 mb-4"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}

                <textarea
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="[12:34] John: Hey, what's up?
[12:35] Jane: Nothing much, you?
..."
                  className="input min-h-[300px] resize-none font-mono text-sm"
                />

                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-[var(--text-muted)]">
                    {chatText.split("\n").filter((l) => l.trim()).length} lines
                  </p>
                  <button
                    onClick={handleAnalyze}
                    disabled={!chatText.trim()}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4" />
                    Analyze Chat
                  </button>
                </div>
              </motion.div>
            )}

            {step === "analyzing" && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center py-20"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border border-[var(--text)] mx-auto mb-8 flex items-center justify-center"
                >
                  <Loader2 className="w-6 h-6" />
                </motion.div>

                <h2 className="text-2xl font-light mb-4">
                  Analyzing your conversation
                </h2>

                <p className="text-[var(--text-muted)] mb-8">
                  Our AI is processing your chat history...
                </p>

                {/* Progress bar */}
                <div className="max-w-xs mx-auto">
                  <div className="h-1 bg-[var(--border)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-[var(--text)]"
                    />
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-2">
                    {progress}%
                  </p>
                </div>
              </motion.div>
            )}

            {step === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center py-20"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-20 h-20 border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] mx-auto mb-8 flex items-center justify-center"
                >
                  <Check className="w-8 h-8" />
                </motion.div>

                <h2 className="text-4xl font-light mb-4">
                  Analysis
                  <br />
                  <span className="italic">complete</span>
                </h2>

                <p className="text-[var(--text-muted)] mb-8">
                  Your conversation has been analyzed. View the results on your
                  dashboard.
                </p>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      setStep("upload");
                      setChatText("");
                    }}
                    className="btn btn-secondary"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Analyze Another
                  </button>
                  <Link href="/dashboard" className="btn btn-primary">
                    View Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
