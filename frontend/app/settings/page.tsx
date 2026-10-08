"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeControl from "@/components/ThemeControl";
import {
  changeMyPassword,
  getCurrentUser,
  logoutUser,
} from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkUser() {
      try {
        const response = await getCurrentUser();

        if (cancelled) return;

        if (response.user.role === "admin") {
          router.replace("/admin");
        }
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    checkUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await changeMyPassword({
        currentPassword,
        newPassword,
      });

      setSuccess(response.message);
      showToast(response.message, "success");

      setCurrentPassword("");
      setNewPassword("");
    } catch (passwordError) {
      setError(
        passwordError instanceof Error
          ? passwordError.message
          : "Unable to change password"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutUser();
      router.replace("/login");
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Logout failed"
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b0f0e] px-4 py-10 text-[#f1f5f4] sm:px-6">
        <section className="mx-auto max-w-3xl animate-pulse">
          <div className="h-5 w-28 rounded bg-[#1b2421]" />

          <div className="mt-8 h-9 w-40 rounded bg-[#1b2421]" />

          <div className="mt-3 h-4 w-72 rounded bg-[#141a18]" />

          <div className="mt-10 space-y-5">
            <div className="h-40 rounded-3xl border border-white/[0.06] bg-[#141a18]" />
            <div className="h-80 rounded-3xl border border-white/[0.06] bg-[#141a18]" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0f0e] px-4 py-10 text-[#f1f5f4] sm:px-6 lg:px-8">
      <section className="animate-float-in mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#657773] transition hover:text-[#5eead4]"
          >
            <span>←</span>
            Dashboard
          </button>

          <div className="mt-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#5eead4]/15 bg-[#5eead4]/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#5eead4]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
              Account settings
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Settings
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#94a3a0]">
              Customize your experience and keep your account secure.
            </p>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-[#fb7185]/20 bg-[#fb7185]/[0.08] px-5 py-4 text-sm text-[#fda4af]"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fb7185]/10 font-bold">
                !
              </span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-2xl border border-[#34d399]/20 bg-[#34d399]/[0.08] px-5 py-4 text-sm text-[#6ee7b7]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#34d399]/10 font-bold">
                ✓
              </span>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* Appearance */}
        <section className="mb-5 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#141a18] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <div className="border-b border-white/[0.07] px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#5eead4]/15 bg-[#5eead4]/[0.06] text-[#5eead4]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M3 12h2M19 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                </svg>
              </div>

              <div>
                <h2 className="font-semibold">Appearance</h2>
                <p className="mt-1 text-xs text-[#657773]">
                  Choose how E-Membership looks for you.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0b0f0e] p-5">
              <p className="text-sm font-medium text-[#cbd5d2]">
                Theme preference
              </p>

              <p className="mt-1 text-xs leading-5 text-[#657773]">
                Choose a light, dark, or system-based appearance.
              </p>

              <div className="mt-5">
                <ThemeControl />
              </div>
            </div>
          </div>
        </section>

        {/* Password */}
        <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#141a18] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <div className="border-b border-white/[0.07] px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#5eead4]/15 bg-[#5eead4]/[0.06] text-[#5eead4]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="11"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M8 10V7a4 4 0 0 1 8 0v3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 14v3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div>
                <h2 className="font-semibold">Change password</h2>
                <p className="mt-1 text-xs text-[#657773]">
                  Use a strong password to protect your account.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={updatePassword}
            className="space-y-6 p-6 sm:p-8"
          >
            {/* Current password */}
            <div>
              <label
                htmlFor="current-password"
                className="block text-sm font-semibold text-[#cbd5d2]"
              >
                Current password
              </label>

              <input
                id="current-password"
                required
                autoComplete="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                placeholder="Enter your current password"
                className="mt-2 w-full rounded-xl border border-white/[0.09] bg-[#0b0f0e] px-4 py-3 text-[#f1f5f4] outline-none transition placeholder:text-[#52615d] focus:border-[#5eead4]/50 focus:ring-4 focus:ring-[#5eead4]/[0.06]"
              />
            </div>

            {/* New password */}
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-semibold text-[#cbd5d2]"
              >
                New password
              </label>

              <input
                id="new-password"
                required
                minLength={8}
                autoComplete="new-password"
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                placeholder="Enter your new password"
                className="mt-2 w-full rounded-xl border border-white/[0.09] bg-[#0b0f0e] px-4 py-3 text-[#f1f5f4] outline-none transition placeholder:text-[#52615d] focus:border-[#5eead4]/50 focus:ring-4 focus:ring-[#5eead4]/[0.06]"
              />

              <p className="mt-2 text-xs text-[#657773]">
                Your new password must contain at least 8 characters.
              </p>
            </div>

            {/* Password action */}
            <div className="border-t border-white/[0.07] pt-6">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#5eead4] px-6 py-3 text-sm font-bold text-[#0b0f0e] shadow-[0_8px_25px_rgba(94,234,212,0.1)] transition hover:bg-[#2dd4bf] hover:shadow-[0_10px_30px_rgba(94,234,212,0.16)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Updating..." : "Update password"}
              </button>
            </div>
          </form>
        </section>

        {/* Session */}
        <section className="mt-5 rounded-2xl border border-white/[0.06] bg-[#111614] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#cbd5d2]">
                Account session
              </h2>

              <p className="mt-1 text-xs leading-5 text-[#657773]">
                Sign out from your current E-Membership session.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-[#fb7185]/15 bg-[#fb7185]/[0.04] px-4 py-2.5 text-sm font-semibold text-[#fb7185] transition hover:border-[#fb7185]/30 hover:bg-[#fb7185]/[0.08]"
            >
              Logout
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}