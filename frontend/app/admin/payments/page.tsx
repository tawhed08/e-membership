
"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  getAllPayments,
  logoutUser,
  updatePaymentStatus,
  User,
  Payment,
  AdminPayment,
} from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<
    AdminPayment[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");
  const [actionId, setActionId] = useState<string | null>(
    null
  );

  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getAllPayments({
        page,
        limit: 20,
        search,
        status,
      });

      setPayments(response.payments);
      setPages(
        Math.max(1, response.pagination.pages)
      );
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load payments"
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    getCurrentUser()
      .then((userResponse) => {
        if (userResponse.user.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        setUser(userResponse.user);
        setAuthorized(true);
      })
      .catch((authError: unknown) => {
        setError(
          authError instanceof Error
            ? authError.message
            : "Unable to verify admin access"
        );

        router.replace("/login");
      });
  }, [router]);

  useEffect(() => {
    if (!authorized) return;

    const timer = window.setTimeout(() => {
      void loadPayments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [authorized, loadPayments]);

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

  async function updatePayment(
    paymentId: string,
    action: "approve" | "reject"
  ) {
    try {
      setActionId(paymentId);
      setError("");

      const data = await updatePaymentStatus(
        paymentId,
        action
      );

      showToast(data.message, "success");

      setPayments((currentPayments) =>
        currentPayments.map((payment) => {
          if (payment._id !== paymentId) {
            return payment;
          }

          if (action === "approve") {
            return {
              ...payment,
              status: "approved",
              membership: payment.membership
                ? {
                    ...payment.membership,
                    status: "active",
                    paymentStatus: "paid",
                    startDate:
                      data.membership?.startDate ||
                      payment.membership.startDate,
                    expiryDate:
                      data.membership?.expiryDate ||
                      payment.membership.expiryDate,
                  }
                : payment.membership,
            };
          }

          return {
            ...payment,
            status: "rejected",
          };
        })
      );
    } catch (updateError) {
      console.error(updateError);

      setError(
        updateError instanceof Error
          ? updateError.message
          : `Failed to ${action} payment`
      );
    } finally {
      setActionId(null);
    }
  }

  function formatDate(date?: string) {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

  function getStatusClasses(
    paymentStatus: Payment["status"]
  ) {
    switch (paymentStatus) {
      case "approved":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

      case "pending":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";

      case "rejected":
        return "border-rose-400/20 bg-rose-400/10 text-rose-300";

      case "refunded":
        return "border-orange-400/20 bg-orange-400/10 text-orange-300";

      default:
        return "border-white/[0.10] bg-[#1b2421] text-[#94a3a0]";
    }
  }

  function getMethodClasses(method: string) {
    switch (method.toLowerCase()) {
      case "bkash":
        return "border-pink-400/20 bg-pink-400/10 text-pink-300";

      case "nagad":
        return "border-orange-400/20 bg-orange-400/10 text-orange-300";

      case "bank":
        return "border-sky-400/20 bg-sky-400/10 text-sky-300";

      case "card":
        return "border-[#5eead4]/20 bg-[#5eead4]/10 text-[#5eead4]";

      default:
        return "border-white/[0.10] bg-[#1b2421] text-[#94a3a0]";
    }
  }

  const pendingCount = payments.filter(
    (payment) => payment.status === "pending"
  ).length;

  const approvedCount = payments.filter(
    (payment) => payment.status === "approved"
  ).length;

  const rejectedCount = payments.filter(
    (payment) => payment.status === "rejected"
  ).length;

  if (loading && !payments.length) {
    return (
      <main
        aria-busy="true"
        className="min-h-screen bg-[#0b0f0e] px-4 py-12 text-white"
      >
        <div className="mx-auto max-w-7xl">
          <LoadingSkeleton className="mb-8 h-10 w-72" />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <LoadingSkeleton className="h-28" />
            <LoadingSkeleton className="h-28" />
            <LoadingSkeleton className="h-28" />
          </div>

          <LoadingSkeleton className="h-96" />
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#0b0f0e] text-[#f1f5f4]">
      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#0b0f0e]/90 backdrop-blur-xl">
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
              onClick={() => router.push("/admin")}
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

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Heading */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="mb-4 text-sm text-[#657773] transition hover:text-[#5eead4]"
          >
            ← Back to Dashboard
          </button>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 px-3 py-1.5 text-xs font-medium text-[#5eead4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
            Payment Management
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Payments
          </h2>

          <p className="mt-2 max-w-2xl text-[#94a3a0]">
            Review member payments and activate
            memberships after successful approval.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300"
          >
            {error}
          </div>
        )}

        {/* Search */}
        <section className="mb-6 rounded-2xl border border-white/[0.08] bg-[#141a18] p-4 sm:p-5">
          <form
            onSubmit={submitSearch}
            className="flex flex-col gap-3 lg:flex-row"
          >
            <div className="flex-1">
              <label
                htmlFor="payment-search"
                className="sr-only"
              >
                Search payments
              </label>

              <input
                id="payment-search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search member, transaction or method..."
                className="w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#657773] focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
              />
            </div>

            <div className="lg:w-48">
              <label
                htmlFor="payment-status"
                className="sr-only"
              >
                Filter by payment status
              </label>

              <select
                id="payment-status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
              >
                <option value="all">
                  All statuses
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="approved">
                  Approved
                </option>

                <option value="rejected">
                  Rejected
                </option>

                <option value="refunded">
                  Refunded
                </option>
              </select>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[#5eead4] px-6 py-3 text-sm font-semibold text-[#0b0f0e] transition hover:bg-[#2dd4bf] active:scale-[0.98]"
            >
              Search
            </button>
          </form>
        </section>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-400/20 bg-[#141a18] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#94a3a0]">
                Pending
              </p>

              <span className="rounded-lg bg-amber-400/10 px-2 py-1 text-xs text-amber-300">
                Review
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-amber-300">
              {pendingCount}
            </p>

            <p className="mt-2 text-xs text-[#657773]">
              On current page
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-[#141a18] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#94a3a0]">
                Approved
              </p>

              <span className="rounded-lg bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">
                Paid
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-emerald-300">
              {approvedCount}
            </p>

            <p className="mt-2 text-xs text-[#657773]">
              On current page
            </p>
          </div>

          <div className="rounded-2xl border border-rose-400/20 bg-[#141a18] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#94a3a0]">
                Rejected
              </p>

              <span className="rounded-lg bg-rose-400/10 px-2 py-1 text-xs text-rose-300">
                Declined
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-rose-300">
              {rejectedCount}
            </p>

            <p className="mt-2 text-xs text-[#657773]">
              On current page
            </p>
          </div>
        </div>

        {/* Payment History */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141a18]">
          <div className="flex flex-col gap-1 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h3 className="font-semibold">
                Payment History
              </h3>

              <p className="mt-1 text-sm text-[#657773]">
                {payments.length} payment
                {payments.length !== 1
                  ? "s"
                  : ""}{" "}
                on this page
              </p>
            </div>

            <span className="text-xs text-[#657773]">
              Page {page} of {pages}
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#1b2421] text-xl text-[#5eead4]">
                ৳
              </div>

              <h4 className="font-semibold">
                No payments found
              </h4>

              <p className="mt-2 text-sm text-[#657773]">
                Member payment submissions will appear
                here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="border-b border-white/[0.08] bg-[#0b0f0e]/40">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#657773]">
                      Member
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#657773]">
                      Amount
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#657773]">
                      Method
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#657773]">
                      Transaction
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#657773]">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#657773]">
                      Date
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#657773]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {payments.map((payment) => {
                    const isUpdating =
                      actionId === payment._id;

                    return (
                      <tr
                        key={payment._id}
                        className="transition hover:bg-[#1b2421]/40"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 text-sm font-semibold text-[#5eead4]">
                              {(
                                payment.user?.name ||
                                "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {payment.user?.name ||
                                  "Unknown User"}
                              </p>

                              <p className="mt-1 truncate text-xs text-[#657773]">
                                {payment.user?.email ||
                                  "No email"}
                              </p>

                              {payment.user?.phone && (
                                <p className="mt-1 text-xs text-[#657773]">
                                  {
                                    payment.user
                                      .phone
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="font-semibold text-[#f1f5f4]">
                            ৳
                            {payment.amount.toLocaleString()}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase ${getMethodClasses(
                              payment.method
                            )}`}
                          >
                            {payment.method}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-lg bg-[#0b0f0e] px-2.5 py-1.5 font-mono text-xs text-[#94a3a0]">
                            {payment.transactionId}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                              payment.status
                            )}`}
                          >
                            {payment.status}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-[#94a3a0]">
                          {formatDate(
                            payment.createdAt
                          )}
                        </td>

                        <td className="px-6 py-5">
                          {payment.status ===
                            "pending" &&
                          payment.method !== "card" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void updatePayment(
                                    payment._id,
                                    "approve"
                                  )
                                }
                                disabled={isUpdating}
                                className="rounded-xl bg-[#34d399] px-3 py-2 text-xs font-semibold text-[#0b0f0e] transition hover:bg-[#10b981] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isUpdating
                                  ? "..."
                                  : "Approve"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void updatePayment(
                                    payment._id,
                                    "reject"
                                  )
                                }
                                disabled={isUpdating}
                                className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="text-right text-xs text-[#657773]">
                              {payment.method ===
                                "card" &&
                              payment.status ===
                                "pending"
                                ? "Awaiting gateway confirmation"
                                : "No action"}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {payments.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-[#657773]">
                Page{" "}
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
                    setPage(
                      (value) => value - 1
                    )
                  }
                  className="rounded-xl border border-white/[0.10] px-4 py-2 text-sm font-medium text-[#94a3a0] transition hover:border-[#5eead4]/30 hover:bg-[#5eead4]/10 hover:text-[#5eead4] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>

                <button
                  type="button"
                  disabled={
                    page >= pages || loading
                  }
                  onClick={() =>
                    setPage(
                      (value) => value + 1
                    )
                  }
                  className="rounded-xl border border-white/[0.10] px-4 py-2 text-sm font-medium text-[#94a3a0] transition hover:border-[#5eead4]/30 hover:bg-[#5eead4]/10 hover:text-[#5eead4] disabled:cursor-not-allowed disabled:opacity-40"
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
