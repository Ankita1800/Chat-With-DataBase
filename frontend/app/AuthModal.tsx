"use client";
import { useState, useEffect } from "react";
import { X, Mail, Lock, User, Github } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
  initialMode?: "signin" | "signup";
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = "signin" }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal closes or initialMode changes
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setFullName("");
      setError("");
      setLoading(false);
    } else {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "signin" ? "/auth/login" : "/auth/signup";
      const body = mode === "signin" 
        ? { email, password }
        : { email, password, full_name: fullName };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Authentication failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onSuccess(data.access_token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent("http://localhost:3000/auth/google/callback");
    const scope = encodeURIComponent("email profile");
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    window.location.href = authUrl;
  };

  const handleGithubAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent("http://localhost:3000/auth/github/callback");
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
    window.location.href = authUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="w-full max-w-md rounded-2xl p-8 relative" style={{ backgroundColor: '#FDFBD4' }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg transition-colors"
          style={{ color: '#713600' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="text-3xl font-bold mb-2" style={{ color: '#713600' }}>
          {mode === "signin" ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="mb-6" style={{ color: '#8B5A00' }}>
          {mode === "signin" ? "Sign in to continue" : "Sign up to get started"}
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)', border: '1px solid rgba(193, 120, 23, 0.3)' }}>
            <p className="text-sm" style={{ color: '#713600' }}>{error}</p>
          </div>
        )}

        {/* OAuth buttons - Only show in sign in mode */}
        {mode === "signin" && (
          <>
            <div className="space-y-3 mb-6">
              <button
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-all"
                style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8', color: '#713600' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.backgroundColor = '#F8F4E6'; }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button
                onClick={handleGithubAuth}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-all"
                style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8', color: '#713600' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.backgroundColor = '#F8F4E6'; }}
              >
                <Github className="w-5 h-5" />
                Continue with GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: '#E8DFC8' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4" style={{ backgroundColor: '#FDFBD4', color: '#8B5A00' }}>Or continue with email</span>
              </div>
            </div>
          </>
        )}

        {/* Email/Password form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#713600' }}>
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#8B5A00' }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={mode === "signup"}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8', color: '#713600' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(193, 120, 23, 0.2)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#713600' }}>
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#8B5A00' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8', color: '#713600' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(193, 120, 23, 0.2)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#713600' }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#8B5A00' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8', color: '#713600' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(193, 120, 23, 0.2)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold transition-all"
            style={{ backgroundColor: '#C17817', color: '#FDFBD4' }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#A66212')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#C17817')}
          >
            {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="mt-6 text-center text-sm" style={{ color: '#8B5A00' }}>
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="font-semibold transition-colors"
            style={{ color: '#C17817' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#A66212'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#C17817'}
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
