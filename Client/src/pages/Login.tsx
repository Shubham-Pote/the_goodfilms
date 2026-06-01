import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-black selection:bg-red-500/30">
      {/* Background Image with Dark Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50 hidden sm:block"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop')",
        }}
      />
      <div className="absolute inset-0 z-0 bg-black/60 hidden sm:block" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-black/40 to-black hidden sm:block" />

      {/* Header / Logo */}
      <div className="relative z-20 px-[5%] py-6 sm:py-8">
        <Link to="/" className="inline-block text-red-600 font-extrabold text-3xl sm:text-4xl tracking-tight">
          the_goodfilms
        </Link>
      </div>

      {/* Login Form Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-0 pb-16 sm:pb-24">
        <div className="w-full max-w-[450px] sm:bg-black/75 sm:p-16 rounded-md">
          
          <h1 className="text-[32px] font-bold text-white mb-7">Sign In</h1>

          {error && (
            <div className="mb-4 p-3.5 bg-[#e87c03] rounded text-white text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="relative">
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full h-14 bg-[#333] border-none text-white px-5 rounded placeholder:text-transparent focus:bg-[#454545] focus:ring-0 peer"
                placeholder="Username"
              />
              <label 
                htmlFor="username"
                className={`absolute left-5 text-[#8c8c8c] transition-all duration-200 pointer-events-none
                  ${username ? 'text-[11px] top-1.5' : 'text-[15px] top-4 peer-focus:text-[11px] peer-focus:top-1.5'}`}
              >
                Username
              </label>
            </div>

            <div className="relative">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-14 bg-[#333] border-none text-white px-5 rounded placeholder:text-transparent focus:bg-[#454545] focus:ring-0 peer"
                placeholder="Password"
              />
              <label 
                htmlFor="password"
                className={`absolute left-5 text-[#8c8c8c] transition-all duration-200 pointer-events-none
                  ${password ? 'text-[11px] top-1.5' : 'text-[15px] top-4 peer-focus:text-[11px] peer-focus:top-1.5'}`}
              >
                Password
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-6 bg-[#e50914] hover:bg-[#c11119] text-white font-bold text-[16px] rounded transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="flex justify-between items-center mt-2 text-[#b3b3b3] text-[13px]">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="rememberMe" className="w-4 h-4 rounded-sm bg-[#737373] border-none checked:bg-white focus:ring-0 focus:ring-offset-0" />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
              <a href="#" className="hover:underline">Need help?</a>
            </div>
          </form>


          <div className="mt-4 text-[#8c8c8c] text-[13px] leading-snug">
            This page is protected by Google reCAPTCHA to ensure you're not a bot.{" "}
            <a href="#" className="text-[#0071eb] hover:underline">Learn more.</a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full bg-black/75 border-t border-zinc-900/50 sm:bg-black/50 py-8 mt-auto sm:border-none">
        <div className="max-w-[1000px] mx-auto px-[5%] text-[#737373] text-[13px]">
          <p className="mb-6">Questions? Call 1-800-GOOD-FILMS</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl">
            <a href="#" className="hover:underline">FAQ</a>
            <a href="#" className="hover:underline">Help Center</a>
            <a href="#" className="hover:underline">Terms of Use</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Cookie Preferences</a>
            <a href="#" className="hover:underline">Corporate Information</a>
          </div>
        </div>
      </div>
    </div>
  );
}

