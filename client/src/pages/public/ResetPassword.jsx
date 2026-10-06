import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../services/api.js";
import Button from "../../components/ui/Button.jsx";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      toast.success("Password reset successfully. Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "mt-1 w-full border border-sand rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald";

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-sand/40 px-6 py-16">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">
        <h1 className="text-2xl font-extrabold text-forest">Set a new password</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium text-ink">New password</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Confirm password</label>
            <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
          </div>
          <Button type="submit" disabled={loading} className="w-full justify-center">
            {loading ? "Saving..." : "Reset password"}
          </Button>
          <Link to="/login" className="block text-center text-emerald font-medium text-sm">Back to login</Link>
        </form>
      </div>
    </div>
  );
}
