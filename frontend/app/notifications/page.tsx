"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  Notification,
  Pagination,
} from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

export default function NotificationsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getCurrentUser()
      .then((currentUser) => {
        if (currentUser.user.role === "admin") {
          router.replace("/admin/notifications");
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await getMyNotifications({
        page,
        limit: 20,
      });

      setNotifications(response.notifications);
      setPagination(response.pagination);
      setUnreadCount(response.unread);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load notifications"
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (!authorized) return;

    const timer = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [authorized, loadNotifications]);

  async function markRead(notification: Notification) {
    setWorking(true);
    setError("");

    try {
      const response = await markNotificationRead(notification._id);

      setNotifications((items) =>
        items.map((item) =>
          item._id === notification._id ? response.notification : item
        )
      );

      if (!notification.readAt) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      showToast("Notification marked as read.", "success");
    } catch (markError) {
      setError(
        markError instanceof Error
          ? markError.message
          : "Unable to update notification"
      );
    } finally {
      setWorking(false);
    }
  }

  async function markAllRead() {
    setWorking(true);
    setError("");

    try {
      await markAllNotificationsRead();

      const readAt = new Date().toISOString();

      setNotifications((items) =>
        items.map((item) => ({
          ...item,
          readAt,
        }))
      );

      setUnreadCount(0);

      showToast("All notifications marked as read.", "success");
    } catch (markError) {
      setError(
        markError instanceof Error
          ? markError.message
          : "Unable to update notifications"
      );
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b0f0e] px-4 py-10 text-[#f1f5f4] sm:px-6">
        <section className="mx-auto max-w-4xl">
          <div className="mb-8 h-5 w-32 animate-pulse rounded bg-[#1b2421]" />
          <div className="h-10 w-72 animate-pulse rounded bg-[#1b2421]" />
          <div className="mt-3 h-5 w-52 animate-pulse rounded bg-[#141a18]" />

          <div className="mt-10 space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-white/[0.06] bg-[#141a18]"
              />
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0f0e] px-4 py-10 text-[#f1f5f4] sm:px-6 lg:px-8">
      <section className="animate-float-in mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#5eead4] transition hover:text-[#99f6e4]"
          >
            <span>←</span>
            Dashboard
          </button>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#5eead4]/15 bg-[#5eead4]/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#5eead4]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
                Notifications
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Notification center
              </h1>

              <p className="mt-2 text-sm text-[#94a3a0]">
                Stay updated with your membership activity and important
                account messages.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-[#141a18] px-4 py-2.5 text-sm">
                <span className="font-semibold text-[#5eead4]">
                  {unreadCount}
                </span>{" "}
                <span className="text-[#94a3a0]">unread</span>
              </div>

              <button
                type="button"
                disabled={working || unreadCount === 0}
                onClick={() => void markAllRead()}
                className="rounded-xl border border-[#5eead4]/20 bg-[#141a18] px-4 py-2.5 text-sm font-semibold text-[#d9fffa] transition hover:border-[#5eead4]/50 hover:bg-[#1b2421] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {working ? "Updating..." : "Mark all as read"}
              </button>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-[#fb7185]/20 bg-[#fb7185]/[0.08] px-5 py-4 text-sm text-[#fda4af]"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5">!</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Notification list */}
        <div className="space-y-3">
          {notifications.map((notification) => {
            const isUnread = !notification.readAt;

            return (
              <article
                key={notification._id}
                className={`group rounded-2xl border p-5 transition duration-200 sm:p-6 ${
                  isUnread
                    ? "border-[#5eead4]/20 bg-[#141a18] shadow-[0_0_30px_rgba(94,234,212,0.04)] hover:border-[#5eead4]/35 hover:bg-[#18201e]"
                    : "border-white/[0.06] bg-[#111614] hover:border-white/[0.1] hover:bg-[#141a18]"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Status icon */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                      isUnread
                        ? "border-[#5eead4]/20 bg-[#5eead4]/[0.08] text-[#5eead4]"
                        : "border-white/[0.07] bg-[#1b2421] text-[#94a3a0]"
                    }`}
                  >
                    {isUnread ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#5eead4] shadow-[0_0_12px_rgba(94,234,212,0.7)]" />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 12.5 9.5 17 19 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5eead4]" />
                          )}

                          <h2
                            className={`font-semibold ${
                              isUnread
                                ? "text-[#f1f5f4]"
                                : "text-[#cbd5d2]"
                            }`}
                          >
                            {notification.title}
                          </h2>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-[#94a3a0]">
                          {notification.message}
                        </p>

                        <p className="mt-3 text-xs text-[#657773]">
                          {new Date(
                            notification.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>

                      {isUnread && (
                        <button
                          type="button"
                          disabled={working}
                          onClick={() => void markRead(notification)}
                          className="shrink-0 self-start rounded-lg border border-[#5eead4]/15 bg-[#5eead4]/[0.05] px-3 py-2 text-xs font-semibold text-[#5eead4] transition hover:border-[#5eead4]/35 hover:bg-[#5eead4]/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Empty state */}
          {!notifications.length && (
            <div className="rounded-3xl border border-dashed border-white/[0.1] bg-[#111614] px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#5eead4]/15 bg-[#5eead4]/[0.06] text-[#5eead4]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path
                    d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h2 className="mt-5 text-lg font-semibold">
                You&apos;re all caught up
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#657773]">
                Membership updates, payment messages, certificate updates,
                and important reminders will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[#111614] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-[#94a3a0]">
              Page{" "}
              <span className="font-semibold text-[#f1f5f4]">{page}</span>{" "}
              of{" "}
              <span className="font-semibold text-[#f1f5f4]">
                {pagination.pages}
              </span>
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-xl border border-white/[0.08] bg-[#141a18] px-4 py-2.5 text-sm font-medium text-[#cbd5d2] transition hover:border-[#5eead4]/25 hover:text-[#5eead4] disabled:cursor-not-allowed disabled:opacity-35"
              >
                ← Previous
              </button>

              <button
                type="button"
                disabled={page >= pagination.pages || loading}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-xl border border-[#5eead4]/15 bg-[#5eead4]/[0.05] px-4 py-2.5 text-sm font-semibold text-[#5eead4] transition hover:border-[#5eead4]/35 hover:bg-[#5eead4]/[0.1] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}