"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  getMyCertificate,
  getMyMembershipHistory,
  getMyNotifications,
  markAllNotificationsRead,
  Certificate,
  Notification,
  User,
  Membership,
} from "@/lib/api";
import { useMinuteClock } from "@/hooks/useMinuteClock";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export default function DashboardPage() {
  const router = useRouter();
  const now = useMinuteClock();

  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] =
    useState<Membership | null>(null);
  const [membershipHistory, setMembershipHistory] =
    useState<Membership[]>([]);
  const [certificate, setCertificate] =
    useState<Certificate | null>(null);
  const [notifications, setNotifications] =
    useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [membershipLoading, setMembershipLoading] =
    useState(true);
  const [pageError, setPageError] = useState("");
  const [markingRead, setMarkingRead] = useState(false);
  const [copiedCertificate, setCopiedCertificate] = useState(false);

  const unreadCount = unreadNotificationCount;

  const daysRemaining =
    membership?.status === "active" && membership.expiryDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(membership.expiryDate).getTime() - now) /
              (24 * 60 * 60 * 1000)
          )
        )
      : null;

  const membershipProgress =
    membership?.startDate && membership.expiryDate
      ? Math.min(
          100,
          Math.max(
            0,
            ((now - new Date(membership.startDate).getTime()) /
              (new Date(membership.expiryDate).getTime() -
                new Date(membership.startDate).getTime())) *
              100
          )
        )
      : 0;

  useEffect(() => {
    async function loadDashboard() {
      try {
        const userResponse = await getCurrentUser();

        if (userResponse.user.role === "admin") {
          router.replace("/admin");
          return;
        }

        setUser(userResponse.user);

        const [
          membershipsResult,
          certificateResult,
          notificationsResult,
        ] = await Promise.allSettled([
          getMyMembershipHistory(),
          getMyCertificate(),
          getMyNotifications(),
        ]);

        if (membershipsResult.status === "fulfilled") {
          const history = membershipsResult.value.memberships;

          setMembershipHistory(history);
          setMembership(history[0] || null);
        }

        if (certificateResult.status === "fulfilled") {
          setCertificate(certificateResult.value.certificate);
        }

        if (notificationsResult.status === "fulfilled") {
          setNotifications(
            notificationsResult.value.notifications
          );
          setUnreadNotificationCount(
            notificationsResult.value.unread
          );
        }

        const rejectedResult = [
          membershipsResult,
          certificateResult,
          notificationsResult,
        ].find(
          (result) =>
            result.status === "rejected" &&
            !(
              result.reason instanceof Error &&
              result.reason.message === "Certificate not found"
            )
        );

        if (rejectedResult?.status === "rejected") {
          setPageError(
            rejectedResult.reason instanceof Error
              ? rejectedResult.reason.message
              : "Some dashboard information could not be loaded"
          );
        }
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message === "Authentication required" ||
            error.message.includes("authentication token"))
        ) {
          router.replace("/login");
        } else {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to load your dashboard"
          );
        }
      } finally {
        setLoading(false);
        setMembershipLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  async function markAllRead() {
    setMarkingRead(true);
    setPageError("");

    try {
      await markAllNotificationsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: new Date().toISOString(),
        }))
      );

      setUnreadNotificationCount(0);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Unable to update notifications"
      );
    } finally {
      setMarkingRead(false);
    }
  }

  async function copyCertificateId(certificateId: string) {
    try {
      await navigator.clipboard.writeText(certificateId);

      setCopiedCertificate(true);

      window.setTimeout(
        () => setCopiedCertificate(false),
        1800
      );
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Unable to copy certificate ID"
      );
    }
  }

  function formatDate(date?: string) {
    if (!date) {
      return "Not available";
    }

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getPlanName() {
    if (!membership) {
      return "No Membership";
    }

    if (
      typeof membership.plan === "object" &&
      membership.plan
    ) {
      return membership.plan.name;
    }

    return "Membership Plan";
  }

  function getPlanPrice() {
    if (
      membership &&
      typeof membership.plan === "object" &&
      membership.plan
    ) {
      return membership.plan.price;
    }

    return null;
  }

  function getPlanDuration() {
    if (
      membership &&
      typeof membership.plan === "object" &&
      membership.plan
    ) {
      return membership.plan.durationDays;
    }

    return null;
  }

  function getStatusClasses(
    status: Membership["status"]
  ) {
    switch (status) {
      case "active":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

      case "pending":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";

      case "expired":
        return "border-rose-400/20 bg-rose-400/10 text-rose-300";

      case "cancelled":
        return "border-slate-400/20 bg-slate-400/10 text-slate-400";

      default:
        return "border-slate-400/20 bg-slate-400/10 text-slate-400";
    }
  }

  function getPaymentStatusClasses(
    status: Membership["paymentStatus"]
  ) {
    switch (status) {
      case "paid":
        return "text-emerald-300";

      case "pending":
        return "text-amber-300";

      case "failed":
        return "text-rose-300";

      case "refunded":
        return "text-orange-300";

      default:
        return "text-slate-400";
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b0f0e] px-4 py-12 text-[#f1f5f4] sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded-lg bg-white/10" />
            <div className="mt-3 h-4 w-72 rounded bg-white/5" />

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="h-80 rounded-3xl border border-white/10 bg-[#141a18]" />
              <div className="h-80 rounded-3xl border border-white/10 bg-[#141a18]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return pageError ? (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0f0e] px-6 text-[#f1f5f4]">
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-6 py-5">
          <p
            role="alert"
            className="max-w-lg text-center text-sm text-rose-200"
          >
            {pageError}
          </p>
        </div>
      </main>
    ) : null;
  }

  return (
    <main className="min-h-screen bg-[#0b0f0e] text-[#f1f5f4]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        {/* Welcome */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 px-3 py-1.5 text-xs font-semibold text-[#5eead4]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
              Member dashboard
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome, {user.name}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94a3a0] sm:text-base">
              Everything you need to manage your membership,
              payments, notifications and certificates.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="rounded-xl border border-white/10 bg-[#141a18] px-4 py-2.5 text-sm font-medium text-[#cbd5d2] transition hover:border-[#5eead4]/30 hover:text-[#5eead4]"
            >
              Profile
            </button>

            <button
              type="button"
              onClick={() => router.push("/settings")}
              className="rounded-xl border border-white/10 bg-[#141a18] px-4 py-2.5 text-sm font-medium text-[#cbd5d2] transition hover:border-[#5eead4]/30 hover:text-[#5eead4]"
            >
              Settings
            </button>

            <button
              type="button"
              onClick={() => router.push("/notifications")}
              className="rounded-xl border border-white/10 bg-[#141a18] px-4 py-2.5 text-sm font-medium text-[#cbd5d2] transition hover:border-[#5eead4]/30 hover:text-[#5eead4]"
            >
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-[#fb7185] px-2 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {pageError && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
          >
            {pageError}
          </div>
        )}

        {/* Overview cards */}
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Account */}
          <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#141a18] shadow-2xl shadow-black/20">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5eead4]">
                    Account
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    Personal information
                  </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#5eead4]/20 bg-[#5eead4]/10 text-lg text-[#5eead4]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#657773]">
                  Full name
                </p>

                <p className="mt-1.5 font-medium text-[#f1f5f4]">
                  {user.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#657773]">
                  Email
                </p>

                <p className="mt-1.5 break-all font-medium text-[#f1f5f4]">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#657773]">
                  Phone
                </p>

                <p className="mt-1.5 font-medium text-[#f1f5f4]">
                  {user.phone || "Not provided"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[#657773]">
                    Role
                  </p>

                  <span className="mt-2 inline-flex rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 px-3 py-1 text-xs font-semibold capitalize text-[#5eead4]">
                    {user.role}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[#657773]">
                    Status
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                      user.isActive
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                        : "border-rose-400/20 bg-rose-400/10 text-rose-300"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-[#cbd5d2] transition hover:border-[#5eead4]/30 hover:bg-[#5eead4]/5 hover:text-[#5eead4]"
              >
                Manage profile →
              </button>
            </div>
          </article>

          {/* Membership */}
          <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#141a18] shadow-2xl shadow-black/20">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5eead4]">
                    Membership
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    Your current plan
                  </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#34d399]/20 bg-[#34d399]/10 text-lg text-[#34d399]">
                  ✓
                </div>
              </div>
            </div>

            {membershipLoading ? (
              <div className="flex min-h-[350px] items-center justify-center p-6">
                <div className="text-center">
                  <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-white/10 border-t-[#5eead4]" />

                  <p className="mt-3 text-sm text-[#657773]">
                    Loading membership...
                  </p>
                </div>
              </div>
            ) : membership ? (
              <div className="p-6">
                <div className="rounded-2xl border border-white/10 bg-[#0b0f0e] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#657773]">
                        Current plan
                      </p>

                      <h3 className="mt-1 text-2xl font-bold">
                        {getPlanName()}
                      </h3>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${getStatusClasses(
                        membership.status
                      )}`}
                    >
                      {membership.status}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs text-[#657773]">
                        Price
                      </p>

                      <p className="mt-1 font-semibold">
                        {getPlanPrice() !== null
                          ? `৳${getPlanPrice()}`
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#657773]">
                        Duration
                      </p>

                      <p className="mt-1 font-semibold">
                        {getPlanDuration()
                          ? `${getPlanDuration()} days`
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#657773]">
                        Started
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatDate(membership.startDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#657773]">
                        Expires
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatDate(membership.expiryDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-sm text-[#657773]">
                      Payment
                    </span>

                    <span
                      className={`text-sm font-semibold capitalize ${getPaymentStatusClasses(
                        membership.paymentStatus
                      )}`}
                    >
                      {membership.paymentStatus}
                    </span>
                  </div>

                  {membership.status === "active" && (
                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-[#657773]">
                          Membership progress
                        </span>

                        <span className="font-semibold text-[#5eead4]">
                          {daysRemaining} days remaining
                        </span>
                      </div>

                      <div
                        role="progressbar"
                        aria-label="Membership term elapsed"
                        aria-valuenow={Math.round(
                          membershipProgress
                        )}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-2 overflow-hidden rounded-full bg-white/10"
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#0f9f8f] via-[#2dd4bf] to-[#5eead4]"
                          style={{
                            width: `${membershipProgress}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {membership.status === "expired" ? (
                    <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300">
                          !
                        </div>

                        <div>
                          <p className="font-semibold text-rose-200">
                            Your membership has expired
                          </p>

                          <p className="mt-1 text-sm leading-5 text-[#94a3a0]">
                            Renew your membership to continue
                            enjoying member benefits and receive
                            a new certificate.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push("/membership")
                        }
                        className="mt-4 w-full rounded-xl bg-[#5eead4] px-5 py-3 text-sm font-bold text-[#0b0f0e] transition hover:bg-[#2dd4bf]"
                      >
                        Renew Membership →
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        router.push("/membership/payment")
                      }
                      className="mt-6 w-full rounded-xl bg-[#5eead4] px-5 py-3 text-sm font-bold text-[#0b0f0e] transition hover:bg-[#2dd4bf]"
                    >
                      View payment details
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[350px] flex-col items-center justify-center p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#5eead4]/20 bg-[#5eead4]/10 text-2xl text-[#5eead4]">
                  +
                </div>

                <h3 className="mt-5 text-xl font-bold">
                  No membership yet
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-[#657773]">
                  Choose a membership plan to get started
                  with your E-Membership account.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/membership")
                  }
                  className="mt-6 rounded-xl bg-[#5eead4] px-5 py-3 text-sm font-bold text-[#0b0f0e] transition hover:bg-[#2dd4bf]"
                >
                  Explore membership plans
                </button>
              </div>
            )}
          </article>
        </div>

        {/* Quick Access */}
        <section
          id="certificate"
          className="mt-8 scroll-mt-24"
        >
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5eead4]">
              Quick access
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Everything important, one click away
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Membership */}
            <button
              type="button"
              onClick={() =>
                router.push("/membership")
              }
              className="group rounded-2xl border border-white/10 bg-[#141a18] p-5 text-left transition hover:-translate-y-1 hover:border-[#5eead4]/30 hover:bg-[#1b2421]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 text-[#5eead4]">
                M
              </div>

              <h3 className="mt-4 font-semibold">
                Membership
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#657773]">
                Explore plans and manage your membership.
              </p>

              <span className="mt-4 block text-xs font-semibold text-[#5eead4]">
                {membership?.status === "expired"
                  ? "Renew membership →"
                  : "View plans →"}
              </span>
            </button>

            {/* Payments */}
            <button
              type="button"
              onClick={() =>
                router.push("/membership/payment")
              }
              className="group rounded-2xl border border-white/10 bg-[#141a18] p-5 text-left transition hover:-translate-y-1 hover:border-[#34d399]/30 hover:bg-[#1b2421]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#34d399]/20 bg-[#34d399]/10 text-[#34d399]">
                ৳
              </div>

              <h3 className="mt-4 font-semibold">
                Payments
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#657773]">
                Review payment status and payment details.
              </p>

              <span className="mt-4 block text-xs font-semibold text-[#34d399]">
                Open payments →
              </span>
            </button>

            {/* Certificate */}
            {certificate ? (
              <div className="rounded-2xl border border-white/10 bg-[#141a18] p-5 transition hover:-translate-y-1 hover:border-[#2dd4bf]/30">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#2dd4bf]/20 bg-[#2dd4bf]/10 text-[#2dd4bf]">
                  C
                </div>

                <h3 className="mt-4 font-semibold">
                  Certificate
                </h3>

                <p className="mt-2 break-all text-xs leading-5 text-[#94a3a0]">
                  {certificate.certificateId}
                </p>

                <div className="mt-2">
                  <span
                    className={`text-xs capitalize ${
                      certificate.status === "active"
                        ? "text-[#34d399]"
                        : certificate.status === "expired"
                          ? "text-[#fb7185]"
                          : "text-[#94a3a0]"
                    }`}
                  >
                    {certificate.status}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void copyCertificateId(
                      certificate.certificateId
                    )
                  }
                  className="mt-4 text-xs font-semibold text-[#5eead4] hover:text-[#2dd4bf]"
                >
                  {copiedCertificate
                    ? "Copied ✓"
                    : "Copy certificate ID"}
                </button>

                <div className="mt-4 flex flex-wrap gap-3 text-xs">
                  <a
                    href={`${API_URL}/certificates/${encodeURIComponent(
                      certificate.certificateId
                    )}/pdf`}
                    className="font-semibold text-[#5eead4] hover:text-[#2dd4bf]"
                  >
                    Download PDF
                  </a>

                  <a
                    href={`/verify/${encodeURIComponent(
                      certificate.certificateId
                    )}`}
                    className="font-semibold text-[#2dd4bf] hover:text-[#5eead4]"
                  >
                    Verify
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#141a18] p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#94a3a0]">
                  C
                </div>

                <h3 className="mt-4 font-semibold">
                  Certificate
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#657773]">
                  Your certificate will appear here after
                  your membership is activated.
                </p>
              </div>
            )}

            {/* Notifications */}
            <div className="rounded-2xl border border-white/10 bg-[#141a18] p-5 transition hover:-translate-y-1 hover:border-[#f5c76b]/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#f5c76b]/20 bg-[#f5c76b]/10 text-[#f5c76b]">
                !
              </div>

              <h3 className="mt-4 font-semibold">
                Notifications
              </h3>

              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#657773]">
                {notifications.length > 0
                  ? notifications[0].message
                  : "Important membership updates will appear here."}
              </p>

              {notifications.length > 1 && (
                <p className="mt-2 text-xs text-[#657773]">
                  {notifications.length} notifications
                </p>
              )}

              {unreadCount > 0 && (
                <button
                  type="button"
                  disabled={markingRead}
                  onClick={() => void markAllRead()}
                  className="mt-3 text-xs font-semibold text-[#5eead4] disabled:opacity-50"
                >
                  {markingRead
                    ? "Updating..."
                    : `Mark ${unreadCount} as read`}
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  router.push("/notifications")
                }
                className="mt-3 block text-xs font-semibold text-[#5eead4] hover:text-[#2dd4bf]"
              >
                Open notification center →
              </button>
            </div>
          </div>
        </section>

        {/* Membership History */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#141a18]">
          <div className="border-b border-white/10 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5eead4]">
              History
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Membership history
            </h2>
          </div>

          {membershipHistory.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[#657773]">
                No membership history yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider text-[#657773]">
                    <th className="px-6 py-4 font-semibold">
                      Plan
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Started
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Expires
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Payment
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {membershipHistory.map((entry) => (
                    <tr
                      key={entry._id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4 font-medium">
                        {typeof entry.plan === "object"
                          ? entry.plan.name
                          : "Membership Plan"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                            entry.status
                          )}`}
                        >
                          {entry.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-[#94a3a0]">
                        {formatDate(entry.startDate)}
                      </td>

                      <td className="px-6 py-4 text-[#94a3a0]">
                        {formatDate(entry.expiryDate)}
                      </td>

                      <td
                        className={`px-6 py-4 font-semibold capitalize ${getPaymentStatusClasses(
                          entry.paymentStatus
                        )}`}
                      >
                        {entry.paymentStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}