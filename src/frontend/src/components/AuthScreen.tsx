import { Fingerprint, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AuthScreen() {
  const { login, isLoggingIn } = useInternetIdentity();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background glows */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, #8B5CF6 0%, #22C1C3 60%, transparent 100%)",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #22C1C3, transparent)" }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #22C1C3)" }}
          >
            <span className="text-3xl font-bold text-white">C</span>
          </div>
          <h1 className="text-5xl font-bold gradient-text tracking-tight">
            Cal AI
          </h1>
          <p className="text-muted-foreground text-center text-lg">
            Track smarter. Live better.
          </p>
        </motion.div>

        {/* Feature bullets */}
        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {[
            { icon: "🎯", text: "Personalized calorie targets" },
            { icon: "📸", text: "AI-powered food recognition" },
            { icon: "📊", text: "Detailed nutrition analytics" },
          ].map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-3 card-dark px-4 py-3"
            >
              <span className="text-xl">{f.icon}</span>
              <span className="text-foreground/80 text-sm">{f.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Auth card */}
        <motion.div
          className="w-full flex flex-col gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Pill tab switcher */}
          <div className="flex w-full bg-muted rounded-full p-1 relative">
            <motion.div
              className="absolute top-1 bottom-1 rounded-full"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #22C1C3)",
              }}
              animate={{
                left: tab === "signin" ? "4px" : "50%",
                width: "calc(50% - 4px)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <button
              type="button"
              data-ocid="auth.signin.tab"
              onClick={() => setTab("signin")}
              className={`relative z-10 flex-1 h-10 rounded-full text-sm font-semibold transition-colors duration-200 ${
                tab === "signin" ? "text-white" : "text-muted-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              data-ocid="auth.signup.tab"
              onClick={() => setTab("signup")}
              className={`relative z-10 flex-1 h-10 rounded-full text-sm font-semibold transition-colors duration-200 ${
                tab === "signup" ? "text-white" : "text-muted-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Tab panels */}
          <div className="relative min-h-[160px]">
            <AnimatePresence mode="wait">
              {tab === "signin" ? (
                <motion.div
                  key="signin"
                  className="absolute inset-0 flex flex-col gap-4"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="card-dark px-4 py-3 flex items-start gap-3">
                    <ShieldCheck
                      className="w-5 h-5 mt-0.5 shrink-0"
                      style={{ color: "#22C1C3" }}
                    />
                    <p className="text-foreground/70 text-sm leading-snug">
                      Sign in securely with your passkey or biometric. No
                      password required.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-ocid="auth.signin.primary_button"
                    onClick={login}
                    disabled={isLoggingIn}
                    className="w-full h-14 rounded-full text-white font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, #8B5CF6, #22C1C3)",
                    }}
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />{" "}
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-5 h-5" /> Login with Passkey
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  className="absolute inset-0 flex flex-col gap-4"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="card-dark px-4 py-3 flex items-start gap-3">
                    <Sparkles
                      className="w-5 h-5 mt-0.5 shrink-0"
                      style={{ color: "#8B5CF6" }}
                    />
                    <p className="text-foreground/70 text-sm leading-snug">
                      Create your free account in seconds with a passkey — fast,
                      safe, and password-free.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-ocid="auth.signup.primary_button"
                    onClick={login}
                    disabled={isLoggingIn}
                    className="w-full h-14 rounded-full text-white font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, #8B5CF6, #22C1C3)",
                    }}
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Creating
                        account...
                      </>
                    ) : (
                      <>✨ Create Free Account</>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-muted-foreground text-xs text-center">
            Secured by Internet Identity — no passwords needed
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-muted-foreground text-xs">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
