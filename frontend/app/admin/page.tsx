
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminDashboardStats,
  getCurrentUser,
  logoutUser,
  User,
} from "@/lib/api";

interface DashboardStats {
  members: number;
  activeUsers: number;
  inactiveUsers: number;
  totalMemberships: number;
  activeMemberships: number;
  expiredMemberships: number;
  totalPayments: number;
  approvedPayments: number;
  pendingPayments: number;
  certificates: number;
  activeCertificates: number;
  expiredCertificates: number;
  revenue: number;
  months: Array<{
    label: string;
    users: number;
    revenue: number;
  }>;
  paymentStatuses: Array<{
    status: string;
    count: number;
  }>;
}

function formatCurrency(value: number) {
  return `৳${value.toLocaleString()}`;
}

function getStatusTone(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
    case "paid":
      return "text-emerald-300 bg-emerald-400/10";

    case "pending":
      return "text-amber-300 bg-amber-400/10";

    case "rejected":
    case "failed":
      return "text-rose-300 bg-rose-400/10";

    default:
      return "text-slate-300 bg-slate-400/10";
  }
}

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState("");
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    async function loadAdmin() {
      try {
        const response = await getCurrentUser();

        if (response.user.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        setUser(response.user);

        try {
          const statsResponse =
            await getAdminDashboardStats();

          setStats(statsResponse.stats);
        } catch (error) {
          setStatsError(
            error instanceof Error
              ? error.message
              : "Unable to load dashboard statistics"
          );
        }
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message === "Authentication required" ||
            error.message.includes(
              "authentication token"
            ))
        ) {
          router.replace("/login");
          return;
        }

        setPageError(
          error instanceof Error
            ? error.message
            : "Unable to load admin dashboard"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadAdmin();
  }, [router]);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await logoutUser();

      router.replace("/login");
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Logout failed"
      );

      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0f0e] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#1b2421] border-t-[#5eead4]" />

          <p className="text-sm text-[#94a3a0]">
            Loading admin panel...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0f0e] px-6 text-white">
        <p
          role="alert"
          className="max-w-lg text-center text-rose-300"
        >
          {pageError ||
            "Unable to load the admin dashboard."}
        </p>
      </main>
    );
  }

  const maxRevenue = Math.max(
    1,
    ...(stats?.months ?? []).map(
      (month) => month.revenue
    )
  );

  const maxUsers = Math.max(
    1,
    ...(stats?.months ?? []).map(
      (month) => month.users
    )
  );

  const paymentTotal = Math.max(
    1,
    (stats?.paymentStatuses ?? []).reduce(
      (sum, item) => sum + item.count,
      0
    )
  );

  return (
    <main className="min-h-screen bg-[#0b0f0e] text-[#f1f5f4]">
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#0b0f0e]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 text-lg font-bold text-[#5eead4]">
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
            </div>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                router.push("/admin/profile")
              }
              className="hidden rounded-xl px-3 py-2 text-sm text-[#94a3a0] transition hover:bg-white/[0.05] hover:text-white sm:block"
            >
              {user.name}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border border-white/[0.10] px-4 py-2 text-sm font-medium text-[#94a3a0] transition hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 px-3 py-1.5 text-xs font-medium text-[#5eead4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
            Admin Panel
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome, {user.name}
          </h2>

          <p className="mt-2 max-w-2xl text-[#94a3a0]">
            Manage members, memberships, payments,
            certificates and system settings from one
            place.
          </p>
        </div>

        {pageError && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300"
          >
            {pageError}
          </div>
        )}

        <section>
          <div className="mb-4">
            <h3 className="font-semibold">
              Overview
            </h3>

            <p className="mt-1 text-sm text-[#657773]">
              Current platform statistics
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.08] bg-[#141a18] p-5 transition hover:border-[#5eead4]/20">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#94a3a0]">
                  Approved Revenue
                </p>

                <span className="rounded-lg bg-[#5eead4]/10 px-2 py-1 text-xs text-[#5eead4]">
                  Revenue
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold tracking-tight text-[#5eead4]">
                {stats
                  ? formatCurrency(stats.revenue)
                  : "—"}
              </p>

              <p className="mt-2 text-xs text-[#657773]">
                Lifetime approved payments
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#141a18] p-5 transition hover:border-[#5eead4]/20">
              <p className="text-sm text-[#94a3a0]">
                Total Members
              </p>

              <p className="mt-4 text-3xl font-bold">
                {stats?.members ?? "—"}
              </p>

              <p className="mt-2 text-xs text-[#657773]">
                {stats?.activeUsers ?? "—"} active
                {" · "}
                {stats?.inactiveUsers ?? "—"} inactive
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#141a18] p-5 transition hover:border-[#5eead4]/20">
              <p className="text-sm text-[#94a3a0]">
                Active Memberships
              </p>

              <p className="mt-4 text-3xl font-bold text-[#34d399]">
                {stats?.activeMemberships ?? "—"}
              </p>

              <p className="mt-2 text-xs text-[#657773]">
                {stats?.totalMemberships ?? "—"} total
                {" · "}
                {stats?.expiredMemberships ?? "—"} expired
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#141a18] p-5 transition hover:border-[#5eead4]/20">
              <p className="text-sm text-[#94a3a0]">
                Pending Payments
              </p>

              <p className="mt-4 text-3xl font-bold text-[#f5c76b]">
                {stats?.pendingPayments ?? "—"}
              </p>

              <p className="mt-2 text-xs text-[#657773]">
                {stats?.totalPayments ?? "—"} total
                {" · "}
                {stats?.approvedPayments ?? "—"} approved
              </p>
            </div>
          </div>
        </section>

        {stats && (
          <section
            id="analytics"
            className="mt-8 scroll-mt-24"
          >
            <div className="mb-4">
              <h3 className="font-semibold">
                Analytics
              </h3>

              <p className="mt-1 text-sm text-[#657773]">
                Recent growth and payment activity
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-white/[0.08] bg-[#141a18] p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">
                      Growth & Revenue
                    </h4>

                    <p className="mt-1 text-sm text-[#657773]">
                      Last six months
                    </p>
                  </div>

                  <span className="rounded-lg bg-[#5eead4]/10 px-2.5 py-1 text-xs text-[#5eead4]">
                    Monthly
                  </span>
                </div>

                <div className="mt-8 grid h-48 grid-cols-6 items-end gap-3">
                  {stats.months.map((month) => (
                    <div
                      key={month.label}
                      className="flex h-full flex-col justify-end gap-2 text-center"
                    >
                      <div className="flex h-40 items-end justify-center gap-1.5">
                        <div
                          title={`${month.users} new users`}
                          className="w-3 rounded-t bg-[#5eead4]/70 transition-all"
                          style={{
                            height: `${Math.max(
                              5,
                              (month.users /
                                maxUsers) *
                                100
                            )}%`,
                          }}
                        />

                        <div
                          title={`${formatCurrency(
                            month.revenue
                          )} revenue`}
                          className="w-3 rounded-t bg-[#34d399]/70 transition-all"
                          style={{
                            height: `${Math.max(
                              5,
                              (month.revenue /
                                maxRevenue) *
                                100
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="text-[11px] text-[#657773]">
                        {month.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-5 text-xs text-[#657773]">
                  <span className="flex items-center gap-2">
                    <i className="h-2 w-2 rounded-full bg-[#5eead4]" />
                    New users
                  </span>

                  <span className="flex items-center gap-2">
                    <i className="h-2 w-2 rounded-full bg-[#34d399]" />
                    Revenue
                  </span>
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.08] bg-[#141a18] p-6">
                <div>
                  <h4 className="font-semibold">
                    Payment Overview
                  </h4>

                  <p className="mt-1 text-sm text-[#657773]">
                    Submissions by status
                  </p>
                </div>

                <div className="mt-6 space-y-5">
                  {stats.paymentStatuses.map(
                    (item) => {
                      const percentage =
                        (item.count /
                          paymentTotal) *
                        100;

                      return (
                        <div key={item.status}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span
                              className={`rounded-lg px-2 py-1 text-xs font-medium capitalize ${getStatusTone(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>

                            <span className="text-sm font-semibold">
                              {item.count}
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-[#1b2421]">
                            <div
                              className="h-full rounded-full bg-[#5eead4] transition-all"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}

                  {!stats.paymentStatuses.length && (
                    <div className="rounded-xl border border-dashed border-white/[0.08] py-10 text-center">
                      <p className="text-sm text-[#657773]">
                        No payment activity yet.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </section>
        )}

        {statsError && (
          <p
            role="alert"
            className="mt-4 text-sm text-rose-300"
          >
            Dashboard statistics: {statsError}
          </p>
        )}

        <section className="mt-10">
          <div className="mb-4">
            <h3 className="font-semibold">
              Management
            </h3>

            <p className="mt-1 text-sm text-[#657773]">
              Quick access to your admin tools
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                router.push("/admin/memberships")
              }
              className="group rounded-2xl border border-white/[0.08] bg-[#141a18] p-6 text-left transition duration-200 hover:-translate-y-1 hover:border-[#5eead4]/30 hover:bg-[#1b2421]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 text-xl">
                👥
              </div>

              <h4 className="font-semibold">
                Members
              </h4>

              <p className="mt-2 text-sm leading-6 text-[#657773]">
                View and manage registered members and
                their memberships.
              </p>

              <span className="mt-5 inline-block text-sm font-medium text-[#5eead4]">
                Manage Members →
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/admin/plans")
              }
              className="group rounded-2xl border border-white/[0.08] bg-[#141a18] p-6 text-left transition duration-200 hover:-translate-y-1 hover:border-[#5eead4]/30 hover:bg-[#1b2421]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#34d399]/20 bg-[#34d399]/10 text-xl">
                ★
              </div>

              <h4 className="font-semibold">
                Membership Plans
              </h4>

              <p className="mt-2 text-sm leading-6 text-[#657773]">
                Create, update and manage membership
                plans.
              </p>

              <span className="mt-5 inline-block text-sm font-medium text-[#5eead4]">
                Manage Plans →
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/admin/payments")
              }
              className="group rounded-2xl border border-white/[0.08] bg-[#141a18] p-6 text-left transition duration-200 hover:-translate-y-1 hover:border-[#f5c76b]/30 hover:bg-[#1b2421]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#f5c76b]/20 bg-[#f5c76b]/10 text-xl text-[#f5c76b]">
                ৳
              </div>

              <h4 className="font-semibold">
                Payments
              </h4>

              <p className="mt-2 text-sm leading-6 text-[#657773]">
                Review, approve and manage member
                payments.
              </p>

              <span className="mt-5 inline-block text-sm font-medium text-[#f5c76b]">
                Manage Payments →
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/admin/users")
              }
              className="group rounded-2xl border border-white/[0.08] bg-[#141a18] p-6 text-left transition duration-200 hover:-translate-y-1 hover:border-[#5eead4]/30 hover:bg-[#1b2421]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#2dd4bf]/20 bg-[#2dd4bf]/10 text-xl">
                👤
              </div>

              <h4 className="font-semibold">
                User Management
              </h4>

              <p className="mt-2 text-sm leading-6 text-[#657773]">
                Search and manage member accounts and
                account status.
              </p>

              <span className="mt-5 inline-block text-sm font-medium text-[#5eead4]">
                Manage Users →
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/admin/certificates")
              }
              className="group rounded-2xl border border-white/[0.08] bg-[#141a18] p-6 text-left transition duration-200 hover:-translate-y-1 hover:border-[#5eead4]/30 hover:bg-[#1b2421]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 text-xl">
                📜
              </div>

              <h4 className="font-semibold">
                Certificates
              </h4>

              <p className="mt-2 text-sm leading-6 text-[#657773]">
                Issue, download and manage membership
                certificates.
              </p>

              <span className="mt-5 inline-block text-sm font-medium text-[#5eead4]">
                Manage Certificates →
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/admin/notifications")
              }
              className="group rounded-2xl border border-white/[0.08] bg-[#141a18] p-6 text-left transition duration-200 hover:-translate-y-1 hover:border-[#5eead4]/30 hover:bg-[#1b2421]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 text-xl">
                🔔
              </div>

              <h4 className="font-semibold">
                Notifications
              </h4>

              <p className="mt-2 text-sm leading-6 text-[#657773]">
                Send and manage important membership
                notifications.
              </p>

              <span className="mt-5 inline-block text-sm font-medium text-[#5eead4]">
                Manage Notifications →
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/admin/profile")
              }
              className="group rounded-2xl border border-white/[0.08] bg-[#141a18] p-6 text-left transition duration-200 hover:-translate-y-1 hover:border-[#5eead4]/30 hover:bg-[#1b2421]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-[#1b2421] text-xl">
                👨‍💼
              </div>

              <h4 className="font-semibold">
                Admin Profile
              </h4>

              <p className="mt-2 text-sm leading-6 text-[#657773]">
                View and manage your administrator
                profile.
              </p>

              <span className="mt-5 inline-block text-sm font-medium text-[#5eead4]">
                Open Profile →
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/admin/settings")
              }
              className="group rounded-2xl border border-white/[0.08] bg-[#141a18] p-6 text-left transition duration-200 hover:-translate-y-1 hover:border-[#5eead4]/30 hover:bg-[#1b2421]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-[#1b2421] text-xl">
                ⚙
              </div>

              <h4 className="font-semibold">
                Settings
              </h4>

              <p className="mt-2 text-sm leading-6 text-[#657773]">
                Manage payment, email and system
                configuration.
              </p>

              <span className="mt-5 inline-block text-sm font-medium text-[#5eead4]">
                System Settings →
              </span>
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}