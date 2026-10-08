"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AdminUser,
  getAdminUsers,
  getCurrentUser,
  logoutUser,
  updateUserStatus,
} from "@/lib/api";

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getAdminUsers({
        page,
        limit: 20,
        search,
        status,
      });

      setUsers(response.users);
      setPages(Math.max(1, response.pagination.pages));
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load users"
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    getCurrentUser()
      .then((response) => {
        if (response.user.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        setAuthorized(true);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  useEffect(() => {
    if (!authorized) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [authorized, loadUsers]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  }

  async function setActive(user: AdminUser) {
    setActionId(user._id);
    setError("");

    try {
      const response = await updateUserStatus(
        user._id,
        !user.isActive
      );

      setUsers((items) =>
        items.map((item) =>
          item._id === user._id ? response.user : item
        )
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update user"
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await logoutUser();

      router.replace("/login");
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Logout failed"
      );

      setLoggingOut(false);
    }
  }

  const stats = useMemo(() => {
    const active = users.filter((user) => user.isActive).length;
    const inactive = users.length - active;

    return {
      visible: users.length,
      active,
      inactive,
    };
  }, [users]);

  return (
    <main className="min-h-screen bg-[#0b0f0e] text-[#f1f5f4]">
      {/* Top navigation */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0b0f0e]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="group flex items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 font-bold text-[#5eead4] shadow-[0_0_24px_rgba(94,234,212,0.08)] transition group-hover:border-[#5eead4]/40 group-hover:bg-[#5eead4]/15">
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
            disabled={loggingOut}
            className="rounded-xl border border-white/[0.10] px-4 py-2.5 text-sm font-medium text-[#94a3a0] transition hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Page heading */}
        <section className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="mb-5 inline-flex items-center gap-2 text-sm text-[#657773] transition hover:text-[#5eead4]"
          >
            <span>←</span>
            Back to Dashboard
          </button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 px-3 py-1.5 text-xs font-medium text-[#5eead4]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4] shadow-[0_0_8px_rgba(94,234,212,0.8)]" />
                User Management
              </div>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Members
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94a3a0] sm:text-base">
                Search, review and manage registered member
                accounts from one place.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#141a18] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#657773]">
                Current page
              </p>

              <p className="mt-1 text-lg font-semibold text-[#f1f5f4]">
                {page}
                <span className="mx-1.5 text-[#657773]">
                  /
                </span>
                {pages}
              </p>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300"
          >
            <span className="mt-0.5">!</span>

            <div>
              <p className="font-medium">
                Something went wrong
              </p>

              <p className="mt-1 text-rose-300/80">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-[#141a18] p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#94a3a0]">
                Members shown
              </span>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5eead4]/10 text-sm font-bold text-[#5eead4]">
                #
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold">
              {stats.visible}
            </p>

            <p className="mt-1 text-xs text-[#657773]">
              Results on this page
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/10 bg-[#141a18] p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#94a3a0]">
                Active
              </span>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                ✓
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold text-emerald-300">
              {stats.active}
            </p>

            <p className="mt-1 text-xs text-[#657773]">
              Currently active accounts
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#141a18] p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#94a3a0]">
                Inactive
              </span>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-400/10 text-slate-300">
                —
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-300">
              {stats.inactive}
            </p>

            <p className="mt-1 text-xs text-[#657773]">
              Currently inactive accounts
            </p>
          </div>
        </section>

        {/* Search and filters */}
        <section className="mb-6 rounded-2xl border border-white/[0.08] bg-[#141a18] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.16)] sm:p-5">
          <div className="mb-4">
            <h3 className="font-semibold">
              Find members
            </h3>

            <p className="mt-1 text-xs text-[#657773]">
              Search by name or email and filter by account status.
            </p>
          </div>

          <form
            onSubmit={submitSearch}
            className="flex flex-col gap-3 lg:flex-row"
          >
            <div className="relative flex-1">
              <label
                htmlFor="member-search"
                className="sr-only"
              >
                Search members
              </label>

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#657773]">
                ⌕
              </span>

              <input
                id="member-search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] py-3 pl-11 pr-4 text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#657773] focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
              />
            </div>

            <div className="lg:w-52">
              <label
                htmlFor="member-status"
                className="sr-only"
              >
                Filter by status
              </label>

              <select
                id="member-status"
                value={status}
                onChange={(event) => {
                  setStatus(
                    event.target.value as typeof status
                  );
                  setPage(1);
                }}
                className="w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
              >
                <option value="all">
                  All statuses
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[#5eead4] px-7 py-3 text-sm font-semibold text-[#0b0f0e] shadow-[0_8px_24px_rgba(94,234,212,0.12)] transition hover:bg-[#2dd4bf] active:scale-[0.98]"
            >
              Search Members
            </button>
          </form>
        </section>

        {/* Members table */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141a18] shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  Registered Members
                </h3>

                <span className="rounded-full bg-[#1b2421] px-2 py-0.5 text-[11px] font-medium text-[#94a3a0]">
                  {users.length}
                </span>
              </div>

              <p className="mt-1 text-xs text-[#657773]">
                Manage account status and member details.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/[0.08] bg-[#0b0f0e] px-3 py-1.5 text-xs text-[#657773] sm:self-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
              Page {page} of {pages}
            </div>
          </div>

          {loading ? (
            <div className="divide-y divide-white/[0.06]">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 px-5 py-5"
                >
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[#1b2421]" />

                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-[#1b2421]" />
                    <div className="h-3 w-56 animate-pulse rounded bg-[#1b2421]" />
                  </div>

                  <div className="hidden h-4 w-24 animate-pulse rounded bg-[#1b2421] md:block" />

                  <div className="hidden h-4 w-24 animate-pulse rounded bg-[#1b2421] sm:block" />

                  <div className="h-8 w-24 animate-pulse rounded-xl bg-[#1b2421]" />
                </div>
              ))}
            </div>
          ) : users.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-white/[0.08] bg-[#1b2421]/50 text-[11px] uppercase tracking-[0.14em] text-[#657773]">
                  <tr>
                    <th className="px-5 py-4 font-medium">
                      Member
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Phone
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Joined
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {users.map((user) => {
                    const isUpdating =
                      actionId === user._id;

                    const initial =
                      user.name?.charAt(0)?.toUpperCase() ||
                      "U";

                    return (
                      <tr
                        key={user._id}
                        className="group transition hover:bg-[#1b2421]/35"
                      >
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 text-sm font-bold text-[#5eead4] transition group-hover:border-[#5eead4]/35 group-hover:bg-[#5eead4]/15">
                              {initial}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[#f1f5f4]">
                                {user.name}
                              </p>

                              <p className="mt-1 truncate text-xs text-[#657773]">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 text-[#94a3a0]">
                          {user.phone || "—"}
                        </td>

                        <td className="px-5 py-5 text-[#94a3a0]">
                          {user.createdAt
                            ? new Date(
                                user.createdAt
                              ).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "—"}
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                              user.isActive
                                ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
                                : "border-slate-400/10 bg-slate-400/10 text-slate-300"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                user.isActive
                                  ? "bg-emerald-300"
                                  : "bg-slate-400"
                              }`}
                            />

                            {user.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-right">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              void setActive(user)
                            }
                            className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              user.isActive
                                ? "border-rose-400/20 text-rose-300 hover:bg-rose-400/10"
                                : "border-[#5eead4]/20 text-[#5eead4] hover:bg-[#5eead4]/10"
                            }`}
                          >
                            {isUpdating
                              ? "Updating..."
                              : user.isActive
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border-t border-white/[0.06] px-6 py-16 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#1b2421] text-xl text-[#5eead4]">
                ⌕
              </div>

              <h3 className="font-semibold">
                No members found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#657773]">
                No members matched your current search or
                status filter. Try changing your search
                criteria.
              </p>

              {(search || status !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setStatus("all");
                    setPage(1);
                  }}
                  className="mt-5 rounded-xl border border-[#5eead4]/20 px-4 py-2 text-sm font-medium text-[#5eead4] transition hover:bg-[#5eead4]/10"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>

        {/* Pagination */}
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#657773]">
            Showing page{" "}
            <span className="font-medium text-[#94a3a0]">
              {page}
            </span>{" "}
            of{" "}
            <span className="font-medium text-[#94a3a0]">
              {pages}
            </span>
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() =>
                setPage((value) => value - 1)
              }
              className="rounded-xl border border-white/[0.10] px-4 py-2.5 text-sm font-medium text-[#94a3a0] transition hover:border-[#5eead4]/30 hover:bg-[#5eead4]/10 hover:text-[#5eead4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>

            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() =>
                setPage((value) => value + 1)
              }
              className="rounded-xl border border-white/[0.10] px-4 py-2.5 text-sm font-medium text-[#94a3a0] transition hover:border-[#5eead4]/30 hover:bg-[#5eead4]/10 hover:text-[#5eead4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}