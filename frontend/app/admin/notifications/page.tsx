"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  getAdminNotifications,
  getCurrentUser,
  logoutUser,
  Notification,
  Pagination,
} from "@/lib/api";

type AdminNotification = Notification & {
  user?: {
    _id: string;
    name: string;
    email: string;
  };
};

export default function AdminNotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<
    AdminNotification[]
  >([]);

  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] =
    useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkAdminAccess() {
      try {
        const response = await getCurrentUser();

        if (cancelled) return;

        if (response.user.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        setAuthorized(true);
      } catch {
        if (cancelled) return;

        router.replace("/login");
      }
    }

    checkAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    async function loadNotifications() {
      try {
        setLoading(true);

        const response =
          await getAdminNotifications({
            page,
            limit: 25,
            search,
          });

        if (cancelled) return;

        setNotifications(response.notifications);
        setPagination(response.pagination);
        setError("");
      } catch (loadError) {
        if (cancelled) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load notifications"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [authorized, page, search]);

  function submitSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
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

  function formatDate(value: string) {
    return new Date(value).toLocaleString(
      "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0f0e] text-[#f1f5f4]">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0b0f0e]/90 backdrop-blur-xl">
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                router.push("/admin")
              }
              className="hidden rounded-xl border border-white/[0.10] px-4 py-2 text-sm font-medium text-[#94a3a0] transition hover:border-[#5eead4]/30 hover:bg-[#5eead4]/10 hover:text-[#5eead4] sm:block"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-white/[0.10] px-4 py-2 text-sm font-medium text-[#94a3a0] transition hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Heading */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              router.push("/admin")
            }
            className="mb-4 text-sm text-[#657773] transition hover:text-[#5eead4]"
          >
            ← Back to Dashboard
          </button>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 px-3 py-1.5 text-xs font-medium text-[#5eead4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
            Notification Center
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Notifications
          </h2>

          <p className="mt-2 max-w-2xl text-[#94a3a0]">
            Monitor membership notifications and
            keep track of important member updates.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-[#141a18] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#94a3a0]">
                Total notifications
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 text-sm text-[#5eead4]">
                N
              </div>
            </div>

            <p className="mt-4 text-3xl font-bold">
              {pagination?.total ?? notifications.length}
            </p>

            <p className="mt-2 text-xs text-[#657773]">
              Across the notification system
            </p>
          </div>

          <div className="rounded-2xl border border-[#5eead4]/15 bg-[#141a18] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#94a3a0]">
                Current page
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 text-sm text-[#5eead4]">
                {page}
              </div>
            </div>

            <p className="mt-4 text-3xl font-bold text-[#5eead4]">
              {notifications.length}
            </p>

            <p className="mt-2 text-xs text-[#657773]">
              Notifications displayed
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#141a18] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#94a3a0]">
                Pages
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-[#1b2421] text-sm text-[#94a3a0]">
                #
              </div>
            </div>

            <p className="mt-4 text-3xl font-bold">
              {pagination?.pages ?? 1}
            </p>

            <p className="mt-2 text-xs text-[#657773]">
              Available result pages
            </p>
          </div>
        </div>

        {/* Search */}
        <section className="mb-6 rounded-2xl border border-white/[0.08] bg-[#141a18] p-4 sm:p-5">
          <form
            onSubmit={submitSearch}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="flex-1">
              <label
                htmlFor="notification-search"
                className="sr-only"
              >
                Search notifications
              </label>

              <input
                id="notification-search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
                placeholder="Search notifications..."
                className="w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#657773] focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[#5eead4] px-6 py-3 text-sm font-semibold text-[#0b0f0e] transition hover:bg-[#2dd4bf] active:scale-[0.98]"
            >
              Search
            </button>
          </form>
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300"
          >
            {error}
          </div>
        )}

        {/* Notification List */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141a18]">
          <div className="flex flex-col gap-1 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h3 className="font-semibold">
                Notification Activity
              </h3>

              <p className="mt-1 text-sm text-[#657773]">
                Recent notifications generated for
                members.
              </p>
            </div>

            {pagination && (
              <span className="text-xs text-[#657773]">
                Page {pagination.page} of{" "}
                {pagination.pages}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-white/[0.08] bg-[#0b0f0e] p-5"
                >
                  <div className="h-4 w-48 rounded bg-[#1b2421]" />

                  <div className="mt-4 h-3 w-full rounded bg-[#1b2421]" />

                  <div className="mt-2 h-3 w-3/4 rounded bg-[#1b2421]" />

                  <div className="mt-4 h-3 w-40 rounded bg-[#1b2421]" />
                </div>
              ))}
            </div>
          ) : notifications.length ? (
            <div className="space-y-3 p-4 sm:p-5">
              {notifications.map(
                (notification) => {
                  const memberName =
                    notification.user?.name ||
                    "Member";

                  const memberEmail =
                    notification.user?.email ||
                    "—";

                  const initial =
                    memberName
                      .charAt(0)
                      .toUpperCase() || "M";

                  return (
                    <article
                      key={notification._id}
                      className="rounded-2xl border border-white/[0.08] bg-[#0b0f0e] p-5 transition hover:border-[#5eead4]/20"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 font-semibold text-[#5eead4]">
                            {initial}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold">
                                {notification.title}
                              </h4>

                              <span className="rounded-full border border-[#5eead4]/15 bg-[#5eead4]/5 px-2.5 py-1 text-[11px] font-medium text-[#5eead4]">
                                Notification
                              </span>
                            </div>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#94a3a0]">
                              {notification.message}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#657773]">
                              <span>
                                Member:{" "}
                                <span className="text-[#94a3a0]">
                                  {memberName}
                                </span>
                              </span>

                              <span>
                                Email:{" "}
                                <span className="text-[#94a3a0]">
                                  {memberEmail}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-left lg:text-right">
                          <p className="text-xs text-[#657773]">
                            Created
                          </p>

                          <p className="mt-1 text-sm text-[#94a3a0]">
                            {formatDate(
                              notification.createdAt
                            )}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#5eead4]/20 bg-[#5eead4]/10 text-xl font-bold text-[#5eead4]">
                N
              </div>

              <h4 className="font-semibold">
                No notifications found
              </h4>

              <p className="mt-2 text-sm text-[#657773]">
                Try a different search term or check
                back when new notifications are created.
              </p>
            </div>
          )}

          {/* Pagination */}
          {!loading &&
            pagination &&
            pagination.pages > 1 && (
              <div className="flex flex-col gap-4 border-t border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-sm text-[#657773]">
                  {pagination.total} notifications ·
                  page{" "}
                  <span className="font-medium text-[#94a3a0]">
                    {pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-[#94a3a0]">
                    {pagination.pages}
                  </span>
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage(
                        (value) => value - 1
                      )
                    }
                    className="rounded-xl border border-white/[0.10] bg-[#141a18] px-4 py-2 text-sm font-medium text-[#94a3a0] transition hover:border-[#5eead4]/30 hover:bg-[#5eead4]/10 hover:text-[#5eead4] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >= pagination.pages
                    }
                    onClick={() =>
                      setPage(
                        (value) => value + 1
                      )
                    }
                    className="rounded-xl border border-white/[0.10] bg-[#141a18] px-4 py-2 text-sm font-medium text-[#94a3a0] transition hover:border-[#5eead4]/30 hover:bg-[#5eead4]/10 hover:text-[#5eead4] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
        </section>
      </section>
    </main>
  );
}