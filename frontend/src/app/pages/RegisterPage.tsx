import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../../context/AuthContext";

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/verify");
    } catch (err: any) {
      const msg = err.response?.data?.error;
      setError(typeof msg === "string" ? msg : msg?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <button onClick={() => navigate("/")} className="flex items-center gap-3 mb-10">
          <img src="/logo.png" alt="B-ware logo" className="w-10 h-10 rounded-xl object-contain" />
          <div>
            <div className="text-white font-bold text-lg tracking-tight">B-ware</div>
            <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest -mt-1">
              No Lies Told
            </div>
          </div>
        </button>

        <h1
          className="text-4xl font-serif font-bold text-white mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Create account
        </h1>
        <p className="text-slate-400 mb-8">Start verifying economic claims today</p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Name</label>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-blue-500/50 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-blue-500/50 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Password</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-blue-500/50 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default RegisterPage;
