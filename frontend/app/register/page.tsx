
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
      });

      setSuccess(response.message);

      setForm({
        name: "",
        email: "",
        password: "",
        phone: "",
      });

      setShowPassword(false);

      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0f0e] px-4 py-10 text-[#f1f5f4] sm:py-14">
      {/* Background atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-180px] h-[430px] w-[430px] -translate-x-1/2 rounded-full bg-teal-400/8 blur-3xl" />
        <div className="absolute bottom-[-220px] left-[-120px] h-[360px] w-[360px] rounded-full bg-emerald-400/5 blur-3xl" />
        <div className="absolute right-[-120px] top-1/3 h-[320px] w-[320px] rounded-full bg-cyan-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full animate-float-in">
          {/* Brand / Header */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-300/10 shadow-[0_0_35px_rgba(94,234,212,0.08)]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-7 w-7 text-teal-300"
              >
                <path
                  d="M12 3l7 3v5.5c0 4.6-2.9 7.8-7 9.5-4.1-1.7-7-4.9-7-9.5V6l7-3z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
              E-Membership
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Create your account
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#94a3a0]">
              Join E-Membership and manage your membership from one place.
            </p>
          </div>

          {/* Registration Card */}
          <div className="rounded-3xl border border-white/10 bg-[#141a18]/95 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-[#dce7e4]"
                >
                  Full name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0b0f0e] px-4 py-3.5 text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#657773] hover:border-white/15 focus:border-teal-300/60 focus:ring-4 focus:ring-teal-300/10"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#dce7e4]"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0b0f0e] px-4 py-3.5 text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#657773] hover:border-white/15 focus:border-teal-300/60 focus:ring-4 focus:ring-teal-300/10"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-[#dce7e4]"
                >
                  Phone number
                  <span className="ml-2 text-xs font-normal text-[#657773]">
                    Optional
                  </span>
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-white/10 bg-[#0b0f0e] px-4 py-3.5 text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#657773] hover:border-white/15 focus:border-teal-300/60 focus:ring-4 focus:ring-teal-300/10"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[#dce7e4]"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#0b0f0e] px-4 py-3.5 pr-12 text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#657773] hover:border-white/15 focus:border-teal-300/60 focus:ring-4 focus:ring-teal-300/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    title={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-[#94a3a0] transition hover:bg-white/5 hover:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300/40"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3l18 18"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.58 10.58a2 2 0 002.84 2.84"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.88 4.24A10.45 10.45 0 0112 4c5 0 8.27 4.5 9 8a11.8 11.8 0 01-2.03 4.14"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.61 6.61C4.91 6.61 3.73 9.5 3 12c.73 2.5 4 7 9 7a9.9 9.9 0 004.39-1.03"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.06 12.35a1 1 0 010-.7C3.55 7.8 7.46 5 12 5s8.45 2.8 9.94 6.65a1 1 0 010 .7C20.45 16.2 16.54 19 12 19s-8.45-2.8-9.94-6.65z"
                        />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                <p className="mt-2 text-xs leading-5 text-[#657773]">
                  Use at least 8 characters for your password.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm leading-5 text-rose-300"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="mt-0.5 h-5 w-5 shrink-0"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path
                      strokeLinecap="round"
                      d="M12 8v4"
                    />
                    <path
                      strokeLinecap="round"
                      d="M12 16h.01"
                    />
                  </svg>

                  <span>{error}</span>
                </div>
              )}

              {/* Success */}
              {success && (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm leading-5 text-emerald-300"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="mt-0.5 h-5 w-5 shrink-0"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12l2.5 2.5L16 9"
                    />
                  </svg>

                  <span>{success}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl bg-teal-300 px-4 py-3.5 font-semibold text-[#0b0f0e] shadow-lg shadow-teal-300/10 transition hover:bg-teal-200 hover:shadow-teal-300/20 focus:outline-none focus:ring-4 focus:ring-teal-300/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin rounded-full border-2 border-[#0b0f0e]/30 border-t-[#0b0f0e]"
                      />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        fill="none"
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      >
                        <path
                          d="M4 10h11M11 6l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Login */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/8" />
              <span className="text-xs text-[#657773]">
                Already registered?
              </span>
              <div className="h-px flex-1 bg-white/8" />
            </div>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-sm font-semibold text-[#dce7e4] transition hover:border-teal-300/30 hover:bg-teal-300/5 hover:text-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-300/10"
            >
              Back to login
            </button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-[#657773]">
            Create your account and get started with E-Membership
          </p>
        </section>
      </div>
    </main>
  );
}