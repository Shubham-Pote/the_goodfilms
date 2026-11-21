import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiUrl } from "@/lib/api";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-main">
        <Brand />
        <div className="auth-form">{children}</div>
        <div className="auth-foot">Movies, series & live events</div>
      </div>
      <div className="auth-art" aria-hidden="true">
        <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=85&w=1500&auto=format&fit=crop" alt="" />
      </div>
    </main>
  );
}

export function Login() {
  const [username, setUsername] = useState(() => localStorage.getItem("remembered_username") || "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => !!localStorage.getItem("remembered_username"));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sign-in failed. Please try again.");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (remember) localStorage.setItem("remembered_username", username);
      else localStorage.removeItem("remembered_username");
      navigate("/");
    } catch (err) {
      setError(err instanceof TypeError ? "Couldn't reach the sign-in service. Please try again." : err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h1>Sign in</h1>
      <form onSubmit={handleLogin} aria-busy={isLoading}>
        {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" autoComplete="current-password" type={showPassword ? "text" : "password"}
              value={password} onChange={(event) => setPassword(event.target.value)} className="pr-14" required />
            <Button variant="ghost" size="icon" type="button" className="absolute inset-y-0 right-0 my-auto size-11"
              aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </Button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm py-1">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Remember my username
        </label>
        <Button type="submit" disabled={isLoading}>{isLoading ? "Signing in…" : "Sign in"} <ArrowRight /></Button>
      </form>
      <p className="auth-switch">New here? <Link to="/signup">Create an account</Link></p>
    </AuthLayout>
  );
}
