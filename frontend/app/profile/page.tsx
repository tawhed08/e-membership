"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getCurrentUser,
  logoutUser,
  updateMyProfile,
  User,
} from "@/lib/api";

import { useToast } from "@/components/ToastProvider";

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await getCurrentUser();

        if (cancelled) return;

        setUser(response.user);
        setName(response.user.name);
        setPhone(response.user.phone || "");
      } catch {
        if (cancelled) return;

        router.replace("/login");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await updateMyProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });

      setUser(response.user);
      setName(response.user.name);
      setPhone(response.user.phone || "");

      setSuccess("Profile updated successfully.");

      showToast("Profile updated successfully.", "success");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update profile"
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
        <div className="mx-auto max-w-3xl">
          <div className="animate-pulse">
            <div className="h-5 w-28 rounded bg-[#1b2421]" />

            <div className="mt-8 flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[#1b2421]" />

              <div>
                <div className="h-7 w-48 rounded bg-[#1b2421]" />
                <div className="mt-3 h-4 w-64 rounded bg-[#141a18]" />
              </div>
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl border border-white/[0.06] bg-[#141a18]">
              <div className="border-b border-white/[0.06] p-6">
                <div className="h-5 w-40 rounded bg-[#1b2421]" />
                <div className="mt-2 h-4 w-72 rounded bg-[#1b2421]" />
              </div>

              <div className="space-y-6 p-6 sm:p-8">
                <div className="h-14 rounded-xl bg-[#1b2421]" />
                <div className="h-14 rounded-xl bg-[#1b2421]" />
                <div className="h-14 rounded-xl bg-[#1b2421]" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const backPath = isAdmin ? "/admin" : "/dashboard";
  const initial = user.name.charAt(0).toUpperCase() || "U";

  return (
    <main className="min-h-screen bg-[#0b0f0e] text-[#f1f5f4]">
      {/* Admin-only navbar.
          User profile already receives the global AppNavbar from layout.tsx. */}
      {isAdmin && (
        <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#0b0f0e]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="flex items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 font-bold text-[#5eead4]">
                E
              </div>

              <div>
                <h1 className="font-bold tracking-tight">
                  E-Membership
                </h1>

                <p className="text-xs text-[#657773]">
                  Admin Dashboard
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm font-medium text-[#94a3a0] transition hover:border-[#fb7185]/30 hover:bg-[#fb7185]/[0.08] hover:text-[#fb7185]"
            >
              Logout
            </button>
          </div>
        </header>
      )}

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.push(backPath)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#657773] transition hover:text-[#5eead4]"
        >
          <span>←</span>
          {isAdmin ? "Admin Dashboard" : "Dashboard"}
        </button>

        {/* Profile heading */}
        <div className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative flex h-18 w-18 shrink-0 items-center justify-center rounded-3xl border border-[#5eead4]/20 bg-[#5eead4]/[0.08] text-3xl font-bold text-[#5eead4] shadow-[0_0_35px_rgba(94,234,212,0.06)]">
              {initial}

              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 border-[#0b0f0e] bg-[#34d399]" />
            </div>

            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#5eead4]/15 bg-[#5eead4]/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#5eead4]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
                {isAdmin ? "Administrator" : "Member Profile"}
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {isAdmin ? "Admin Profile" : "Your Profile"}
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#94a3a0]">
                Manage the personal information associated with your account.
              </p>
            </div>
          </div>
        </div>

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

        {/* Main card */}
        <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#141a18] shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
          {/* Card heading */}
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
                    d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h2 className="font-semibold">Account Information</h2>
                <p className="mt-1 text-xs text-[#657773]">
                  Keep your personal details up to date.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-6 p-6 sm:p-8">
            {/* Name */}
            <div>
              <label
                htmlFor="profile-name"
                className="block text-sm font-semibold text-[#cbd5d2]"
              >
                Full name
              </label>

              <input
                id="profile-name"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your full name"
                className="mt-2 w-full rounded-xl border border-white/[0.09] bg-[#0b0f0e] px-4 py-3 text-[#f1f5f4] outline-none transition placeholder:text-[#52615d] focus:border-[#5eead4]/50 focus:ring-4 focus:ring-[#5eead4]/[0.06]"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="profile-email"
                className="block text-sm font-semibold text-[#cbd5d2]"
              >
                Email address
              </label>

              <div className="relative">
                <input
                  id="profile-email"
                  disabled
                  value={user.email}
                  className="mt-2 w-full cursor-not-allowed rounded-xl border border-white/[0.07] bg-[#0b0f0e]/70 px-4 py-3 pr-12 text-[#657773]"
                />

                <span className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-[#52615d]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <rect
                      x="5"
                      y="11"
                      width="14"
                      height="10"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M8 11V8a4 4 0 0 1 8 0v3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </div>

              <p className="mt-2 text-xs text-[#657773]">
                Email changes require administrator assistance.
              </p>
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="profile-phone"
                className="block text-sm font-semibold text-[#cbd5d2]"
              >
                Phone number
              </label>

              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Enter your phone number"
                className="mt-2 w-full rounded-xl border border-white/[0.09] bg-[#0b0f0e] px-4 py-3 text-[#f1f5f4] outline-none transition placeholder:text-[#52615d] focus:border-[#5eead4]/50 focus:ring-4 focus:ring-[#5eead4]/[0.06]"
              />
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="profile-role"
                className="block text-sm font-semibold text-[#cbd5d2]"
              >
                Account role
              </label>

              <div
                id="profile-role"
                className="mt-2 flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#0b0f0e] px-4 py-3"
              >
                <div>
                  <p className="text-sm text-[#cbd5d2]">
                    Current account type
                  </p>
                  <p className="mt-1 text-xs text-[#52615d]">
                    Your role is managed by the system.
                  </p>
                </div>

                <span className="rounded-full border border-[#5eead4]/20 bg-[#5eead4]/[0.08] px-3 py-1.5 text-xs font-semibold capitalize text-[#5eead4]">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Save */}
            <div className="flex flex-col gap-4 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[#cbd5d2]">
                  Keep your profile current
                </p>
                <p className="mt-1 text-xs text-[#657773]">
                  Changes are saved directly to your account.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#5eead4] px-6 py-3 text-sm font-bold text-[#0b0f0e] shadow-[0_8px_25px_rgba(94,234,212,0.12)] transition hover:bg-[#2dd4bf] hover:shadow-[0_10px_30px_rgba(94,234,212,0.18)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>

        {/* Account security / logout */}
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