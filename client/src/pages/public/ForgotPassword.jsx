import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../services/api.js";
import Button from "../../components/ui/Button.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [devToken, setDevToken] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setDone(true);
      if (data?.data?.resetToken) setDevToken(data.data.resetToken); // dev only, never sent in production
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-sand/40 px-6 py-16">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">
        <h1 className="text-2xl font-extrabold text-forest">Forgot password?</h1>
        <p className="text-muted text-sm mt-1">Enter your email and we'll send you a reset link.</p>

        {done ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-ink">If that email exists, a reset link has been sent. Please check your inbox.</p>
            {devToken && (
              <Link to={`/reset-password/${devToken}`} className="block text-emerald font-medium text-sm">
                (Dev mode) Open reset page
              </Link>
            )}
            <Link to="/login" className="block text-emerald font-medium text-sm">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium text-ink">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-sand rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald"
                placeholder="you@example.com"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? "Sending..." : "Send reset link"}
            </Button>
            <Link to="/login" className="block text-center text-emerald font-medium text-sm">Back to login</Link>
          </form>
        )}
      </div>
    </div>
  );
}
