import { Loader2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AuthScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, #8B5CF6 0%, #22C1C3 60%, transparent 100%)",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #22C1C3, transparent)" }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
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
        </div>

        {/* Feature bullets */}
        <div
          className="flex flex-col gap-3 w-full animate-fade-in"
          style={{ animationDelay: "0.1s" }}
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
        </div>

        {/* Auth buttons */}
        <div
          className="flex flex-col gap-3 w-full animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <button
            type="button"
            data-ocid="auth.primary_button"
            onClick={login}
            disabled={isLoggingIn}
            className="w-full h-14 rounded-full text-white font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #22C1C3)" }}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Connecting...
              </>
            ) : (
              <>🔐 Login with Passkey</>
            )}
          </button>

          <button
            type="button"
            data-ocid="auth.secondary_button"
            onClick={login}
            disabled={isLoggingIn}
            className="w-full h-14 rounded-full font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 border-2"
            style={{
              borderColor: "#8B5CF6",
              color: "#8B5CF6",
              background: "transparent",
            }}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Connecting...
              </>
            ) : (
              <>✨ Sign Up</>
            )}
          </button>
        </div>

        <p className="text-muted-foreground text-xs text-center">
          Secured by Internet Identity — no passwords needed
        </p>
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
