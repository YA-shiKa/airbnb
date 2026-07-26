"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { User } from "@/types";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<"login" | "signup">(searchParams.get("mode") === "signup" ? "signup" : "login");
  const [seededUsers, setSeededUsers] = useState<User[]>([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.listUsers().then(setSeededUsers).catch(() => {});
  }, []);

  const quickLogin = async (user: User) => {
    setUser(user);
    showToast(`Welcome back, ${user.name.split(" ")[0]}`);
    router.push("/");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        const user = await api.login({ email, password });
        setUser(user);
        showToast(`Welcome back, ${user.name.split(" ")[0]}`);
      } else {
        const user = await api.register({ name, email, password, is_host: isHost });
        setUser(user);
        showToast(`Welcome to airbnb, ${user.name.split(" ")[0]}`);
      }
      router.push("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-1">{mode === "login" ? "Log in" : "Sign up"}</h1>
      <p className="text-subtle text-sm mb-6">
        Auth is mocked for this assignment — passwords aren't securely handled. Use it only to demonstrate the guest/host flows.
      </p>

      {seededUsers.length > 0 && (
        <div className="border border-hairline rounded-2xl p-4 mb-6">
          <p className="text-sm font-semibold mb-3">Quick sign-in as a seeded account</p>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {seededUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => quickLogin(u)}
                className="flex items-center gap-3 border border-hairline rounded-xl px-3 py-2 text-left hover:bg-gray-50"
              >
                {u.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatar_url} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                )}
                <span className="text-sm">
                  <span className="font-medium">{u.name}</span>{" "}
                  <span className="text-subtle">· {u.is_host ? "Host" : "Guest"}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        {mode === "signup" && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Full name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm" />
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Email</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Password</span>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm" />
        </label>
        {mode === "signup" && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isHost} onChange={(e) => setIsHost(e.target.checked)} />
            <span className="text-sm">I want to host stays</span>
          </label>
        )}

        {error && <p className="text-sm text-rausch">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-rausch hover:bg-rausch_dark text-white rounded-lg py-3 font-semibold transition-colors disabled:opacity-60"
        >
          {submitting ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>

      <p className="text-sm text-subtle mt-6 text-center">
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <button className="underline font-medium" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </p>
    </div>
  );
}
