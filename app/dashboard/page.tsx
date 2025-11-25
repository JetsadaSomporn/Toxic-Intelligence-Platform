"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Users,
  MessageSquare,
  LogOut,
  Loader2,
  Heart,
  HeartCrack,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUser, signOut } from "@/lib/supabaseBrowser";
import type { Conversation, Message, ConversationSummary } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Check auth & load conversations
  useEffect(() => {
    const init = async () => {
      const { user, error } = await getUser();
      if (error || !user) {
        router.push("/auth");
        return;
      }

      // Fetch conversations
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
      setLoading(false);
    };
    init();
  }, [router]);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      setSummary(null);
      return;
    }

    const loadData = async () => {
      setLoadingMessages(true);

      const [messagesRes, summaryRes] = await Promise.all([
        fetch(`/api/conversations/${selectedConversation.id}/messages`),
        fetch(`/api/conversations/${selectedConversation.id}/summary`),
      ]);

      if (messagesRes.ok) {
        const data = await messagesRes.json();
        setMessages(data.messages || []);
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary || null);
      }

      setLoadingMessages(false);
    };

    loadData();
  }, [selectedConversation]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const getToxicityColor = (score: number | null) => {
    if (score === null) return "bg-[var(--border)]";
    if (score <= 0.3) return "bg-emerald-500";
    if (score <= 0.6) return "bg-amber-500";
    return "bg-red-500";
  };

  const getToxicityLabel = (score: number | null) => {
    if (score === null) return "Unknown";
    if (score <= 0.3) return "Healthy";
    if (score <= 0.6) return "Moderate";
    return "Toxic";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Noise */}
      <div className="noise" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-6 md:px-12 py-6 border-b border-[var(--border)] flex-shrink-0"
      >
        <nav className="flex items-center justify-between">
          <Link href="/" className="font-medium tracking-tight">
            TOXIC©
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/analyze"
              className="btn btn-primary py-2 px-4 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Analysis
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </nav>
      </motion.header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-80 border-r border-[var(--border)] flex flex-col"
        >
          <div className="p-6 border-b border-[var(--border)]">
            <h2 className="text-sm tracking-widest text-[var(--text-muted)] uppercase">
              Conversations
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-muted)]">
                <MessageSquare className="w-8 h-8 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <Link
                  href="/analyze"
                  className="text-sm mt-2 inline-block link-hover"
                >
                  Create your first analysis
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {conversations.map((conv, i) => (
                  <motion.button
                    key={conv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-[var(--border)] transition-colors ${
                      selectedConversation?.id === conv.id
                        ? "bg-[var(--border)]"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">
                        {conv.title}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {new Date(conv.created_at).toLocaleDateString()}
                    </p>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!selectedConversation ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-16 h-16 border border-[var(--border)] mx-auto mb-6 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-xl font-light mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-[var(--text-muted)] text-sm">
                    Choose from the sidebar or create a new analysis
                  </p>
                </div>
              </motion.div>
            ) : loadingMessages ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center"
              >
                <Loader2 className="w-6 h-6 animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key={selectedConversation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="p-6 md:p-12"
              >
                {/* Title */}
                <div className="mb-8">
                  <span className="text-sm tracking-widest text-[var(--text-muted)] uppercase block mb-2">
                    Analysis Report
                  </span>
                  <h1 className="text-3xl md:text-4xl font-light tracking-tight">
                    {selectedConversation.title}
                  </h1>
                  <p className="text-[var(--text-muted)] text-sm mt-2">
                    Created{" "}
                    {new Date(selectedConversation.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Summary stats */}
                {summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-6 border border-[var(--border)]"
                    >
                      <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">
                          Toxicity
                        </span>
                      </div>
                      <p className="text-3xl font-light">
                        {Math.round(summary.avg_toxicity_overall * 100)}%
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {getToxicityLabel(summary.avg_toxicity_overall)}
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="p-6 border border-[var(--border)]"
                    >
                      <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                        <Users className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">
                          Your Toxicity
                        </span>
                      </div>
                      <p className="text-3xl font-light">
                        {Math.round(summary.avg_toxicity_self * 100)}%
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-6 border border-[var(--border)]"
                    >
                      <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">
                          Partner
                        </span>
                      </div>
                      <p className="text-3xl font-light">
                        {Math.round(summary.avg_toxicity_other * 100)}%
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="p-6 border border-[var(--border)]"
                    >
                      <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                        {summary.breakup_risk_score > 0.5 ? (
                          <HeartCrack className="w-4 h-4" />
                        ) : (
                          <Heart className="w-4 h-4" />
                        )}
                        <span className="text-xs uppercase tracking-wider">
                          Risk
                        </span>
                      </div>
                      <p className="text-3xl font-light">
                        {Math.round(summary.breakup_risk_score * 100)}%
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Breakup risk
                      </p>
                    </motion.div>
                  </div>
                )}

                {/* Additional stats */}
                {summary && (
                  <div className="mb-12">
                    <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {summary.conflict_days_count} conflict days
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>{messages.length} messages</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div>
                  <h2 className="text-sm tracking-widest text-[var(--text-muted)] uppercase mb-6">
                    Messages ({messages.length})
                  </h2>

                  <div className="space-y-3">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 1) }}
                        className={`p-4 border border-[var(--border)] ${
                          msg.sender_type === "SELF"
                            ? "ml-12 bg-[var(--bg)]"
                            : "mr-12"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">
                            {msg.sender_name}
                          </span>
                          {msg.toxicity_score !== null && (
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${getToxicityColor(
                                  msg.toxicity_score
                                )}`}
                              />
                              <span className="text-xs text-[var(--text-muted)]">
                                {Math.round(msg.toxicity_score * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm">{msg.text}</p>
                        {msg.flags && msg.flags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {msg.flags.map((flag, fi) => (
                              <span
                                key={fi}
                                className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded"
                              >
                                {flag}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
