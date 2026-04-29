"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { safeGetClientSession } from "@/lib/supabaseClientAuth";
import { authRequest, requestPasswordReset } from "@/lib/authApi";
import { getAuthCallbackUrl } from "@/lib/authRedirect";
import Aurora from "@/components/auth/Aurora";

type AuthPageProps = {
  initialMode?: "login" | "signup";
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTH_AURORA_COLORS: [string, string, string] = ["#7cff67", "#B497CF", "#5227FF"];

export default function AuthPage({ initialMode = "login" }: AuthPageProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);

  // States for Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // States for Signup
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");

  // Common UI State
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const normalizeClientSession = async () => {
      try {
        const {
          data: { session },
        } = await safeGetClientSession(supabase);

        if (cancelled || !session) {
          return;
        }
      } catch {}
    };

    normalizeClientSession();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const onLogin = async () => {
    setLoginError("");
    setSubmitMessage("");

    if (!loginEmail.trim() || !EMAIL_REGEX.test(loginEmail)) {
      setLoginError("Enter a valid email address.");
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      await authRequest("login", {
        email: loginEmail.trim(),
        password: loginPassword,
      });

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async () => {
    setSignupError("");
    setSubmitMessage("");

    if (!signupName.trim()) {
      setSignupError("Name is required.");
      return;
    }
    if (!signupEmail.trim() || !EMAIL_REGEX.test(signupEmail)) {
      setSignupError("Enter a valid email address.");
      return;
    }
    if (!signupPassword.trim()) {
      setSignupError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      const authResult = await authRequest("signup", {
        email: signupEmail.trim(),
        password: signupPassword,
        name: signupName.trim(),
      });

      if (!(authResult as { session?: unknown }).session) {
        setSignupPassword("");
        setSubmitMessage("Account created. Please verify your email, then sign in.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setSignupError(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    setLoginError("");
    setSubmitMessage("");
    const email = loginEmail.trim();

    if (!email) {
      setLoginError("Enter your email first, then click Forgot password.");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setLoginError("Enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      await requestPasswordReset({ email });
      setSubmitMessage("Reset link sent. Check your inbox and spam folder for the password reset email.");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to send reset email right now.");
    } finally {
      setLoading(false);
    }
  };

  const onOAuth = async (provider: "google" | "github") => {
    setLoginError("");
    setSubmitMessage("");
    setOauthLoading(provider);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthCallbackUrl("/dashboard"),
        },
      });

      if (error) {
        setLoginError(error.message);
        setOauthLoading(null);
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "OAuth login failed.");
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-on-background relative flex items-center justify-center overflow-hidden selection:bg-brand-teal/30 selection:text-brand-teal dark">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-80">
        <Aurora
          colorStops={AUTH_AURORA_COLORS}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>

      {/* Main Content Wrapper */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col items-center">
        {/* Brand / Header */}
        <div className="mb-8 text-center">
          <h1 className="font-headline-xl text-[40px] font-bold leading-none tracking-tighter md:text-[44px]">
            <span className="text-brand-ice drop-shadow-[0_0_15px_rgba(232,244,255,0.3)]">LUMINOUS</span>{" "}
            <span className="text-brand-lavender drop-shadow-[0_0_15px_rgba(184,169,255,0.3)]">ETHER</span>
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-3 opacity-80">
            Access the nexus interface
          </p>
        </div>

        {submitMessage && (
          <div className="mb-8 p-4 bg-brand-teal/20 border border-brand-teal/50 rounded-xl text-brand-teal w-full max-w-4xl text-center">
            {submitMessage}
          </div>
        )}

        {/* Central Layout Container */}
        <div className="w-full rounded-[2rem] p-4 md:p-6 flex flex-col lg:flex-row gap-6 lg:gap-10 relative z-10">
          {/* Card 1: Sign In */}
          <div className="auth-card-enter flex-1 bg-[#15151f] shadow-2xl rounded-3xl p-6 relative group">
            <div className="relative z-10 flex h-full flex-col">
              <h2 className="font-headline-lg text-[30px] font-semibold leading-tight text-white mb-2 flex items-center gap-3">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  login
                </span>
                Sign In
              </h2>
              <p className="font-body-md text-sm text-on-surface-variant mb-6">
                Welcome back. Authenticate to continue.
              </p>

              {loginError && <p className="text-error mb-4 text-sm">{loginError}</p>}

              <form className="flex flex-1 flex-col" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-2 pl-1">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                      mail
                    </span>
                    <input
                      className="w-full bg-surface-container-lowest text-on-surface font-body-md text-sm rounded-xl py-3 pl-12 pr-4 border-none focus:ring-1 focus:ring-brand-teal neu-inset placeholder:text-on-surface-variant/30 transition-all"
                      placeholder="Enter your email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2 pl-1 pr-1">
                    <label className="block font-label-md text-label-md text-on-surface">Password</label>
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="font-label-md text-label-md text-brand-periwinkle hover:text-white transition-colors text-xs"
                      disabled={loading}
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                      lock
                    </span>
                    <input
                      className="w-full bg-surface-container-lowest text-on-surface font-body-md text-sm rounded-xl py-3 pl-12 pr-4 border-none focus:ring-1 focus:ring-brand-teal neu-inset placeholder:text-on-surface-variant/30 transition-all"
                      placeholder="••••••••"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                </div>
                <div className="mt-auto pt-4">
                <div className="-translate-y-3">
                <button
                  onClick={onLogin}
                  disabled={loading || oauthLoading !== null}
                  className="auth-primary-button w-full text-white font-label-md text-label-md rounded-xl py-3.5 uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-55"
                  type="button"
                >
                  <span className="material-symbols-outlined auth-primary-button-icon" aria-hidden="true">
                    bolt
                  </span>
                  <span className="relative z-10">{loading ? "Authenticating..." : "Authenticate"}</span>
                </button>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => onOAuth("google")}
                    disabled={loading || oauthLoading !== null}
                    className="auth-oauth-button"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.08 5.08 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77a6.53 6.53 0 0 1-3.71 1.06 6.21 6.21 0 0 1-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09A6.54 6.54 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84A6.21 6.21 0 0 1 12 5.38z" />
                    </svg>
                    <span>{oauthLoading === "google" ? "Opening..." : "Google"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOAuth("github")}
                    disabled={loading || oauthLoading !== null}
                    className="auth-oauth-button"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .08 1.53 1.08 1.53 1.08.89 1.58 2.34 1.12 2.91.86.09-.67.35-1.12.64-1.38-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.72 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.9c.85 0 1.7.12 2.5.35 1.9-1.33 2.75-1.05 2.75-1.05.54 1.42.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.33 4.8-4.56 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.23 10.23 0 0 0 22 12.22C22 6.58 17.52 2 12 2z" />
                    </svg>
                    <span>{oauthLoading === "github" ? "Opening..." : "GitHub"}</span>
                  </button>
                </div>
                </div>
              </form>
            </div>
          </div>

          {/* Separator for mobile/desktop */}
          <div className="hidden lg:flex flex-col items-center justify-center px-2">
            <span className="font-label-md text-label-md text-on-surface-variant/50 my-4 bg-surface/80 px-2 rounded-full">
              OR
            </span>
          </div>
          <div className="lg:hidden flex items-center justify-center py-4 w-full relative">
            <span className="relative z-10 font-label-md text-label-md text-on-surface-variant/50 bg-surface px-4 py-1 rounded-full">
              OR
            </span>
          </div>

          {/* Card 2: Sign Up */}
          <div className="auth-card-enter flex-1 bg-[#15151f] shadow-2xl rounded-3xl p-6 relative group">
            <div className="relative z-10 flex h-full flex-col">
              <h2 className="font-headline-lg text-[30px] font-semibold leading-tight text-white mb-2 flex items-center gap-3">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  person_add
                </span>
                Sign Up
              </h2>
              <p className="font-body-md text-sm text-on-surface-variant mb-6">Initialize a new identity matrix.</p>

              {signupError && <p className="text-error mb-4 text-sm">{signupError}</p>}

              <form className="flex flex-1 flex-col" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-2 pl-1">Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                      badge
                    </span>
                    <input
                      className="w-full bg-surface-container-lowest text-on-surface font-body-md text-sm rounded-xl py-3 pl-12 pr-4 border-none focus:ring-1 focus:ring-brand-violet neu-inset placeholder:text-on-surface-variant/30 transition-all"
                      placeholder="Enter your alias"
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-2 pl-1">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                      mail
                    </span>
                    <input
                      className="w-full bg-surface-container-lowest text-on-surface font-body-md text-sm rounded-xl py-3 pl-12 pr-4 border-none focus:ring-1 focus:ring-brand-violet neu-inset placeholder:text-on-surface-variant/30 transition-all"
                      placeholder="Enter your email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-2 pl-1">Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                      key
                    </span>
                    <input
                      className="w-full bg-surface-container-lowest text-on-surface font-body-md text-sm rounded-xl py-3 pl-12 pr-4 border-none focus:ring-1 focus:ring-brand-violet neu-inset placeholder:text-on-surface-variant/30 transition-all"
                      placeholder="Create a strong key"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                </div>
                <div className="mt-auto pt-4">
                <button
                  onClick={onSignup}
                  disabled={loading}
                  className="auth-primary-button w-full font-label-md text-label-md rounded-xl py-3.5 uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-55"
                  type="button"
                >
                  <span className="material-symbols-outlined auth-primary-button-icon" aria-hidden="true">
                    auto_awesome
                  </span>
                  <span className="relative z-10">{loading ? "Initializing..." : "Initialize"}</span>
                </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
