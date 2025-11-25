"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { signInWithMagicLink } from "@/lib/supabaseBrowser";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    setError(null);

    const { error } = await signInWithMagicLink(email);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Noise */}
      <div className="noise" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-6 md:px-12 py-6"
      >
        <nav className="flex items-center justify-between">
          <Link href="/" className="font-medium tracking-tight">
            TOXIC©
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </nav>
      </motion.header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 md:px-12 py-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-12"
                >
                  <span className="text-sm tracking-widest text-[var(--text-muted)] uppercase block mb-4">
                    Authentication
                  </span>
                  <h1 className="text-4xl md:text-5xl font-light tracking-tight">
                    Sign in to
                    <br />
                    <span className="italic">continue</span>
                  </h1>
                </motion.div>

                {/* Form */}
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm text-[var(--text-muted)] mb-2"
                    >
                      Email address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input"
                      required
                      autoFocus
                      autoComplete="email"
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        Sending...
                      </motion.span>
                    ) : (
                      <>
                        <span>Send Magic Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.form>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center text-[var(--text-muted)] text-sm mt-8"
                >
                  No password needed. We&apos;ll send you a magic link.
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                {/* Success icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-20 h-20 border border-[var(--text)] mx-auto mb-8 flex items-center justify-center"
                >
                  <Check className="w-8 h-8" />
                </motion.div>

                <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
                  Check your
                  <br />
                  <span className="italic">inbox</span>
                </h1>

                <p className="text-[var(--text-muted)] mb-2">
                  We sent a magic link to
                </p>
                <p className="font-medium mb-8">{email}</p>

                <button
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors link-hover"
                >
                  Use different email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-6 border-t border-[var(--border)]">
        <p className="text-center text-sm text-[var(--text-muted)]">
          Your data is encrypted and secure.
        </p>
      </footer>
    </div>
  );
}
