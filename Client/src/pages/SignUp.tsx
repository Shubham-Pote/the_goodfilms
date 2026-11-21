import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiUrl } from "@/lib/api";
import { AuthLayout } from "./Login";

export function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("Male");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch(apiUrl("/api/auth/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, gender }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Signup failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthLayout>
      <h1>Create an account.</h1>
      <form onSubmit={handleSignup} aria-busy={saving}>
        {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="gender">Gender</Label>
          <select id="gender" value={gender} onChange={(event) => setGender(event.target.value)} className="rounded-md border border-input px-3 text-sm">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <Button type="submit" disabled={saving}>{saving ? "Creating account…" : "Create account"}</Button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  );
}
