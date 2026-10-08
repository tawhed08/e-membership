"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  AdminMembership,
  MembershipPlan,
  AdminUser,
  createAdminMembership,
  getActiveMembershipPlans,
  getAdminMemberships,
  getAdminUsers,
  getCurrentUser,
  issueCertificate,
  logoutUser,
} from "@/lib/api";

export default function AdminMembershipsPage() {
  const router = useRouter();

  const [memberships, setMemberships] = useState<
    AdminMembership[]
  >([]);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingFormData, setLoadingFormData] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [authorized, setAuthorized] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [actionId, setActionId] = useState<string | null>(
    null
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [userId, setUserId] = useState("");
  const [planId, setPlanId] = useState("");

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();

    return date.toISOString().split("T")[0];
  });

  const [membershipStatus, setMembershipStatus] =
    useState<"active" | "pending">("active");

  const [paymentStatus, setPaymentStatus] =
    useState<"paid" | "pending">("paid");

  // Admin access
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
      } catch (loadError: unknown) {
        if (cancelled) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to verify admin access"
        );

        router.replace("/login");
      }
    }

    checkAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Load memberships
  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    async function fetchMemberships() {
      try {
        setLoading(true);

        const response = await getAdminMemberships({
          page,
          limit: 20,
          search,
          status,
        });

        if (cancelled) return;

        setMemberships(response.memberships);

        setPages(
          Math.max(1, response.pagination.pages)
        );

        setError("");
      } catch (loadError) {
        if (cancelled) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load memberships"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMemberships();

    return () => {
      cancelled = true;
    };
  }, [authorized, page, search, status]);

  // Load users and plans when Add Membership opens
  useEffect(() => {
    if (!authorized || !showAddForm) return;

    let cancelled = false;

    async function fetchFormData() {
      try {
        setLoadingFormData(true);

        const [usersResponse, plansResponse] =
          await Promise.all([
            getAdminUsers({
              page: 1,
              limit: 100,
              status: "active",
            }),
            getActiveMembershipPlans(),
          ]);

        if (cancelled) return;

        setUsers(usersResponse.users);
        setPlans(plansResponse.plans);

        setUserId((currentUserId) => {
          if (currentUserId) {
            return currentUserId;
          }

          return usersResponse.users[0]?._id || "";
        });

        setPlanId((currentPlanId) => {
          if (currentPlanId) {
            return currentPlanId;
          }

          return plansResponse.plans[0]?._id || "";
        });
      } catch (loadError) {
        if (cancelled) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load users and plans"
        );
      } finally {
        if (!cancelled) {
          setLoadingFormData(false);
        }
      }
    }

    fetchFormData();

    return () => {
      cancelled = true;
    };
  }, [authorized, showAddForm]);

  function submitSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  }

  function resetForm() {
    setUserId(users[0]?._id || "");
    setPlanId(plans[0]?._id || "");

    const date = new Date();

    setStartDate(
      date.toISOString().split("T")[0]
    );

    setMembershipStatus("active");
    setPaymentStatus("paid");
  }

  async function handleAddMembership(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!userId) {
      setError("Please select a user.");
      return;
    }

    if (!planId) {
      setError("Please select a membership plan.");
      return;
    }

    if (!startDate) {
      setError("Please select a start date.");
      return;
    }

    try {
      setSaving(true);

      const response = await createAdminMembership({
        userId,
        planId,
        startDate,
        status: membershipStatus,
        paymentStatus,
      });

      setSuccess(
        response.message ||
          "Membership added successfully."
      );

      setShowAddForm(false);

      resetForm();

      setPage(1);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to add membership"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleIssueCertificate(
    membershipId: string
  ) {
    setError("");
    setSuccess("");
    setActionId(membershipId);

    try {
      const response = await issueCertificate(
        membershipId
      );

      setMemberships((currentMemberships) =>
        currentMemberships.map((membership) =>
          membership._id === membershipId
            ? {
                ...membership,
                certificateIssued: true,
              }
            : membership
        )
      );

      setSuccess(
        response.message ||
          "Certificate issued successfully."
      );
    } catch (issueError) {
      setError(
        issueError instanceof Error
          ? issueError.message
          : "Unable to issue certificate"
      );
    } finally {
      setActionId(null);
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

  function formatDate(value?: string) {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

  function getStatusClasses(
    membershipStatusValue: AdminMembership["status"]
  ) {
    switch (membershipStatusValue) {
      case "active":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

      case "pending":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";

      case "expired":
        return "border-orange-400/20 bg-orange-400/10 text-orange-300";

      case "cancelled":
        return "border-rose-400/20 bg-rose-400/10 text-rose-300";

      default:
        return "border-white/[0.10] bg-[#1b2421] text-[#94a3a0]";
    }
  }

  function getPaymentClasses(
    paymentStatusValue: AdminMembership["paymentStatus"]
  ) {
    switch (paymentStatusValue) {
      case "paid":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

      case "pending":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";

      case "failed":
        return "border-rose-400/20 bg-rose-400/10 text-rose-300";

      case "refunded":
        return "border-orange-400/20 bg-orange-400/10 text-orange-300";

      default:
        return "border-white/[0.10] bg-[#1b2421] text-[#94a3a0]";
    }
  }

  const activeCount = memberships.filter(
    (membership) =>
      membership.status === "active"
  ).length;

  const pendingCount = memberships.filter(
    (membership) =>
      membership.status === "pending"
  ).length;

  const expiredCount = memberships.filter(
    (membership) =>
      membership.status === "expired"
  ).length;

  const selectedPlan = plans.find(
    (plan) => plan._id === planId
  );

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
            Membership Management
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Memberships
              </h2>

              <p className="mt-2 max-w-2xl text-[#94a3a0]">
                Manage member subscriptions, payment
                status, and certificate issuance.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowAddForm((value) => !value)
              }
              className="rounded-xl bg-[#5eead4] px-5 py-3 text-sm font-semibold text-[#0b0f0e] shadow-lg shadow-[#5eead4]/10 transition hover:bg-[#2dd4bf] active:scale-[0.98]"
            >
              {showAddForm
                ? "Close Form"
                : "+ Add Membership"}
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"
          >
            {success}
          </div>
        )}

        {/* Add Membership Form */}
        {showAddForm && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141a18] shadow-2xl shadow-black/20">
            <div className="border-b border-white/[0.08] px-5 py-5 sm:px-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 text-lg text-[#5eead4]">
                  +
                </div>

                <div>
                  <h3 className="font-semibold">
                    Add Membership
                  </h3>

                  <p className="mt-1 text-sm text-[#657773]">
                    Manually create a membership for an
                    existing active user.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {loadingFormData ? (
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0b0f0e] px-4 py-4 text-sm text-[#94a3a0]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#5eead4]" />
                  Loading users and membership plans...
                </div>
              ) : (
                <form
                  onSubmit={handleAddMembership}
                  className="grid gap-5 md:grid-cols-2"
                >
                  <div>
                    <label
                      htmlFor="membership-user"
                      className="mb-2 block text-sm font-medium"
                    >
                      Select User
                    </label>

                    <select
                      id="membership-user"
                      value={userId}
                      onChange={(event) =>
                        setUserId(event.target.value)
                      }
                      className="w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
                    >
                      <option value="">
                        Select a user
                      </option>

                      {users.map((user) => (
                        <option
                          key={user._id}
                          value={user._id}
                        >
                          {user.name} — {user.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="membership-plan"
                      className="mb-2 block text-sm font-medium"
                    >
                      Membership Plan
                    </label>

                    <select
                      id="membership-plan"
                      value={planId}
                      onChange={(event) =>
                        setPlanId(event.target.value)
                      }
                      className="w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
                    >
                      <option value="">
                        Select a plan
                      </option>

                      {plans.map((plan) => (
                        <option
                          key={plan._id}
                          value={plan._id}
                        >
                          {plan.name} — ৳
                          {plan.price.toLocaleString()} —{" "}
                          {plan.durationDays} days
                        </option>
                      ))}
                    </select>

                    {selectedPlan && (
                      <div className="mt-2 flex items-center justify-between text-xs text-[#657773]">
                        <span>
                          Duration:{" "}
                          {selectedPlan.durationDays} days
                        </span>

                        <span className="font-medium text-[#5eead4]">
                          ৳
                          {selectedPlan.price.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="membership-start-date"
                      className="mb-2 block text-sm font-medium"
                    >
                      Start Date
                    </label>

                    <input
                      id="membership-start-date"
                      type="date"
                      value={startDate}
                      onChange={(event) =>
                        setStartDate(event.target.value)
                      }
                      className="w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="membership-status"
                      className="mb-2 block text-sm font-medium"
                    >
                      Membership Status
                    </label>

                    <select
                      id="membership-status"
                      value={membershipStatus}
                      onChange={(event) =>
                        setMembershipStatus(
                          event.target.value as
                            | "active"
                            | "pending"
                        )
                      }
                      className="w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
                    >
                      <option value="active">
                        Active
                      </option>

                      <option value="pending">
                        Pending
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="membership-payment"
                      className="mb-2 block text-sm font-medium"
                    >
                      Payment Status
                    </label>

                    <select
                      id="membership-payment"
                      value={paymentStatus}
                      onChange={(event) =>
                        setPaymentStatus(
                          event.target.value as
                            | "paid"
                            | "pending"
                        )
                      }
                      className="w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
                    >
                      <option value="paid">
                        Paid
                      </option>

                      <option value="pending">
                        Pending
                      </option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-[#5eead4]/10 bg-[#5eead4]/5 p-4 md:col-span-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#5eead4]/10 text-sm text-[#5eead4]">
                        ✓
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#5eead4]">
                          Expiry date is automatic
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#94a3a0]">
                          The system calculates the expiry
                          date automatically from the selected
                          plan&apos;s duration.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-1 sm:flex-row md:col-span-2">
                    <button
                      type="submit"
                      disabled={
                        saving ||
                        loadingFormData ||
                        !users.length ||
                        !plans.length
                      }
                      className="rounded-xl bg-[#5eead4] px-6 py-3 text-sm font-semibold text-[#0b0f0e] transition hover:bg-[#2dd4bf] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? "Adding..."
                        : "Add Membership"}
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={saving}
                      className="rounded-xl border border-white/[0.10] bg-[#1b2421] px-6 py-3 text-sm font-medium text-[#f1f5f4] transition hover:bg-[#202c28] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-400/20 bg-[#141a18] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#94a3a0]">
                Active
              </p>

              <span className="rounded-lg bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">
                Live
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-emerald-300">
              {activeCount}
            </p>

            <p className="mt-2 text-xs text-[#657773]">
              On current page
            </p>
          </div>

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

          <div className="rounded-2xl border border-orange-400/20 bg-[#141a18] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#94a3a0]">
                Expired
              </p>

              <span className="rounded-lg bg-orange-400/10 px-2 py-1 text-xs text-orange-300">
                History
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-orange-300">
              {expiredCount}
            </p>

            <p className="mt-2 text-xs text-[#657773]">
              On current page
            </p>
          </div>
        </div>

        {/* Search */}
        <section className="mb-6 rounded-2xl border border-white/[0.08] bg-[#141a18] p-4 sm:p-5">
          <form
            onSubmit={submitSearch}
            className="flex flex-col gap-3 lg:flex-row"
          >
            <div className="flex-1">
              <label
                htmlFor="membership-search"
                className="sr-only"
              >
                Search memberships
              </label>

              <input
                id="membership-search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search member or membership ID..."
                className="w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#657773] focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
              />
            </div>

            <div className="lg:w-48">
              <label
                htmlFor="membership-filter-status"
                className="sr-only"
              >
                Filter memberships by status
              </label>

              <select
                id="membership-filter-status"
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

                <option value="active">
                  Active
                </option>

                <option value="expired">
                  Expired
                </option>

                <option value="cancelled">
                  Cancelled
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

        {/* Membership Directory */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141a18]">
          <div className="flex flex-col gap-1 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h3 className="font-semibold">
                Membership Directory
              </h3>

              <p className="mt-1 text-sm text-[#657773]">
                {memberships.length} membership
                {memberships.length !== 1
                  ? "s"
                  : ""}{" "}
                on this page
              </p>
            </div>

            <span className="text-xs text-[#657773]">
              Page {page} of {pages}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-6 py-16">
              <div className="flex items-center gap-3 text-sm text-[#94a3a0]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#5eead4]" />
                Loading memberships...
              </div>
            </div>
          ) : memberships.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#1b2421] text-xl text-[#5eead4]">
                M
              </div>

              <h4 className="font-semibold">
                No memberships found
              </h4>

              <p className="mt-2 text-sm text-[#657773]">
                Try changing your search or status filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left">
                <thead className="border-b border-white/[0.08] bg-[#0b0f0e]/40">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#657773]">
                      Member
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#657773]">
                      Plan
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#657773]">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#657773]">
                      Payment
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#657773]">
                      Start
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#657773]">
                      Expiry
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#657773]">
                      Certificate
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {memberships.map((membership) => {
                    const canIssueCertificate =
                      membership.status === "active" &&
                      membership.paymentStatus ===
                        "paid" &&
                      !membership.certificateIssued;

                    const isIssuing =
                      actionId === membership._id;

                    const memberName =
                      membership.user &&
                      typeof membership.user === "object"
                        ? membership.user.name
                        : "Unknown member";

                    const memberEmail =
                      membership.user &&
                      typeof membership.user === "object"
                        ? membership.user.email
                        : "";

                    const memberInitial =
                      memberName
                        .charAt(0)
                        .toUpperCase() || "U";

                    const planName =
                      membership.plan &&
                      typeof membership.plan === "object"
                        ? membership.plan.name
                        : "Unknown plan";

                    const planPrice =
                      membership.plan &&
                      typeof membership.plan === "object"
                        ? membership.plan.price
                        : null;

                    return (
                      <tr
                        key={membership._id}
                        className="transition hover:bg-[#1b2421]/40"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 text-sm font-semibold text-[#5eead4]">
                              {memberInitial}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {memberName}
                              </p>

                              {memberEmail && (
                                <p className="mt-1 max-w-52 truncate text-xs text-[#657773]">
                                  {memberEmail}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div>
                            <p className="font-medium">
                              {planName}
                            </p>

                            {planPrice !== null && (
                              <p className="mt-1 text-xs text-[#657773]">
                                ৳
                                {planPrice.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                              membership.status
                            )}`}
                          >
                            {membership.status}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getPaymentClasses(
                              membership.paymentStatus
                            )}`}
                          >
                            {membership.paymentStatus}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-[#94a3a0]">
                          {formatDate(
                            membership.startDate
                          )}
                        </td>

                        <td className="px-6 py-5 text-sm text-[#94a3a0]">
                          {formatDate(
                            membership.expiryDate
                          )}
                        </td>

                        <td className="px-6 py-5 text-right">
                          {membership.certificateIssued ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                              <span>✓</span>
                              Certificate Issued
                            </span>
                          ) : canIssueCertificate ? (
                            <button
                              type="button"
                              disabled={isIssuing}
                              onClick={() =>
                                handleIssueCertificate(
                                  membership._id
                                )
                              }
                              className="rounded-xl bg-[#5eead4] px-4 py-2 text-xs font-semibold text-[#0b0f0e] transition hover:bg-[#2dd4bf] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isIssuing
                                ? "Issuing..."
                                : "Issue Certificate"}
                            </button>
                          ) : (
                            <span className="text-xs text-[#657773]">
                              Not eligible
                            </span>
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
          {!loading && memberships.length > 0 && (
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
                  className="rounded-xl border border-white/[0.10] bg-[#141a18] px-4 py-2 text-sm font-medium text-[#94a3a0] transition hover:border-[#5eead4]/30 hover:bg-[#5eead4]/10 hover:text-[#5eead4] disabled:cursor-not-allowed disabled:opacity-40"
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