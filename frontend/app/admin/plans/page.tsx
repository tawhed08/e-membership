"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createMembershipPlan,
  deactivateMembershipPlan,
  getAllMembershipPlans,
  getCurrentUser,
  MembershipPlan,
  logoutUser,
  updateMembershipPlan,
} from "@/lib/api";

import { useToast } from "@/components/ToastProvider";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function AdminPlansPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    durationDays: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    durationDays: "",
  });

  const filteredPlans = plans.filter((plan) => {
    const query = search.trim().toLowerCase();

    return (
      (!query ||
        plan.name.toLowerCase().includes(query) ||
        plan.description.toLowerCase().includes(query)) &&
      (statusFilter === "all" ||
        (statusFilter === "active" ? plan.isActive : !plan.isActive))
    );
  });

  const pageSize = 8;

  const pageCount = Math.max(
    1,
    Math.ceil(filteredPlans.length / pageSize)
  );

  const visiblePlans = filteredPlans.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const activePlans = plans.filter((plan) => plan.isActive).length;
  const inactivePlans = plans.filter((plan) => !plan.isActive).length;

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      try {
        setLoading(true);

        const currentUser = await getCurrentUser();

        if (cancelled) return;

        if (currentUser.user.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        const response = await getAllMembershipPlans();

        if (cancelled) return;

        setPlans(response.plans);
        setError("");
      } catch (loadError) {
        if (cancelled) return;

        if (
          loadError instanceof Error &&
          (loadError.message === "Authentication required" ||
            loadError.message.includes("authentication token"))
        ) {
          router.replace("/login");
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load plans"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlans();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await createMembershipPlan({
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        durationDays: Number(form.durationDays),
      });

      setPlans((current) => [response.plan, ...current]);

      setForm({
        name: "",
        description: "",
        price: "",
        durationDays: "",
      });

      setSuccess(response.message);
      showToast(response.message, "success");
      setPage(1);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create plan"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivatePlan(planId: string) {
    setError("");
    setSuccess("");
    setActionId(planId);

    try {
      const response = await deactivateMembershipPlan(planId);

      setPlans((current) =>
        current.map((plan) =>
          plan._id === planId ? response.plan : plan
        )
      );

      setSuccess(response.message);
      showToast(response.message, "success");
    } catch (deactivateError) {
      setError(
        deactivateError instanceof Error
          ? deactivateError.message
          : "Unable to deactivate plan"
      );
    } finally {
      setActionId(null);
    }
  }

  function beginEdit(plan: MembershipPlan) {
    setEditingPlanId(plan._id);

    setEditForm({
      name: plan.name,
      description: plan.description,
      price: String(plan.price),
      durationDays: String(plan.durationDays),
    });

    setError("");
    setSuccess("");
  }

  async function saveEdit(planId: string) {
    setActionId(planId);
    setError("");
    setSuccess("");

    try {
      const response = await updateMembershipPlan(planId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: Number(editForm.price),
        durationDays: Number(editForm.durationDays),
      });

      setPlans((current) =>
        current.map((plan) =>
          plan._id === planId ? response.plan : plan
        )
      );

      setEditingPlanId(null);
      setSuccess(response.message);
      showToast(response.message, "success");
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update plan"
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

  function resetCreateForm() {
    setForm({
      name: "",
      description: "",
      price: "",
      durationDays: "",
    });
  }

  if (loading) {
    return (
      <main
        aria-busy="true"
        className="min-h-screen bg-[#0b0f0e] px-4 py-8 text-[#f1f5f4] sm:px-6 sm:py-10"
      >
        <div className="mx-auto max-w-7xl">
          <LoadingSkeleton className="mb-3 h-5 w-40" />
          <LoadingSkeleton className="mb-8 h-10 w-72" />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <LoadingSkeleton className="h-32" />
            <LoadingSkeleton className="h-32" />
            <LoadingSkeleton className="h-32" />
          </div>

          <LoadingSkeleton className="mb-8 h-80" />
          <LoadingSkeleton className="h-72" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0f0e] text-[#f1f5f4]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#0b0f0e]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="group flex items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 font-bold text-[#5eead4] shadow-[0_0_24px_rgba(94,234,212,0.08)] transition group-hover:border-[#5eead4]/40 group-hover:bg-[#5eead4]/15">
              E
            </div>

            <div>
              <p className="font-bold tracking-tight text-[#f1f5f4]">
                E-Membership
              </p>
              <p className="text-xs text-[#657773]">
                Admin Dashboard
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="hidden rounded-xl border border-white/[0.08] bg-[#141a18] px-4 py-2.5 text-sm font-medium text-[#94a3a0] transition hover:border-[#5eead4]/30 hover:bg-[#5eead4]/10 hover:text-[#5eead4] sm:block"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-rose-400/15 bg-rose-400/[0.04] px-4 py-2.5 text-sm font-medium text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/10"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Page Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#657773] transition hover:text-[#5eead4]"
          >
            <span>←</span>
            Back to Dashboard
          </button>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#5eead4]/15 bg-[#5eead4]/[0.07] px-3 py-1.5 text-xs font-semibold text-[#5eead4]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4] shadow-[0_0_10px_rgba(94,234,212,0.8)]" />
                Membership Management
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#f1f5f4] sm:text-4xl">
                Membership Plans
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94a3a0] sm:text-base">
                Create, edit, and manage the membership options
                available to your members.
              </p>
            </div>

            <div className="rounded-2xl border border-[#5eead4]/10 bg-[#141a18] px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#657773]">
                Plan availability
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                <span className="text-sm font-semibold text-[#f1f5f4]">
                  {activePlans} active plans
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-4 text-sm text-rose-300"
          >
            <span className="mt-0.5">!</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-4 text-sm text-emerald-300"
          >
            <span className="mt-0.5">✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="group rounded-2xl border border-white/[0.07] bg-[#141a18] p-5 transition hover:-translate-y-0.5 hover:border-[#5eead4]/20">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#5eead4]/15 bg-[#5eead4]/[0.07] text-[#5eead4]">
                #
              </div>

              <span className="rounded-full border border-white/[0.08] bg-[#0b0f0e] px-2.5 py-1 text-[11px] font-semibold text-[#657773]">
                ALL
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold tracking-tight">
              {plans.length}
            </p>

            <p className="mt-1 text-sm text-[#657773]">
              Total membership plans
            </p>
          </div>

          <div className="group rounded-2xl border border-emerald-400/15 bg-[#141a18] p-5 transition hover:-translate-y-0.5 hover:border-emerald-400/30">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300">
                ✓
              </div>

              <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                LIVE
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold tracking-tight text-emerald-300">
              {activePlans}
            </p>

            <p className="mt-1 text-sm text-[#657773]">
              Currently available
            </p>
          </div>

          <div className="group rounded-2xl border border-amber-400/15 bg-[#141a18] p-5 transition hover:-translate-y-0.5 hover:border-amber-400/30">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.07] text-amber-300">
                —
              </div>

              <span className="rounded-full border border-amber-400/15 bg-amber-400/[0.07] px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                HIDDEN
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold tracking-tight text-amber-300">
              {inactivePlans}
            </p>

            <p className="mt-1 text-sm text-[#657773]">
              No longer available
            </p>
          </div>
        </div>

        {/* Create Plan */}
        <section className="mb-8 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#141a18] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <div className="border-b border-white/[0.07] bg-gradient-to-r from-[#5eead4]/[0.06] to-transparent px-5 py-5 sm:px-7">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 text-xl font-semibold text-[#5eead4]">
                +
              </div>

              <div>
                <h2 className="font-semibold text-[#f1f5f4]">
                  Create a Membership Plan
                </h2>
                <p className="mt-1 text-sm text-[#657773]">
                  Add a new subscription option for your members.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 p-5 sm:p-7 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="plan-name"
                className="mb-2 block text-sm font-medium text-[#dbe5e2]"
              >
                Plan Name
              </label>

              <input
                id="plan-name"
                required
                minLength={2}
                maxLength={100}
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                placeholder="e.g. Premium Membership"
                className="w-full rounded-xl border border-white/[0.09] bg-[#0b0f0e] px-4 py-3.5 text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#53625e] focus:border-[#5eead4]/50 focus:ring-4 focus:ring-[#5eead4]/[0.07]"
              />
            </div>

            <div>
              <label
                htmlFor="plan-description"
                className="mb-2 block text-sm font-medium text-[#dbe5e2]"
              >
                Description
              </label>

              <input
                id="plan-description"
                required
                maxLength={500}
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
                placeholder="Describe what this plan includes"
                className="w-full rounded-xl border border-white/[0.09] bg-[#0b0f0e] px-4 py-3.5 text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#53625e] focus:border-[#5eead4]/50 focus:ring-4 focus:ring-[#5eead4]/[0.07]"
              />
            </div>

            <div>
              <label
                htmlFor="plan-price"
                className="mb-2 block text-sm font-medium text-[#dbe5e2]"
              >
                Price
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5eead4]">
                  ৳
                </span>

                <input
                  id="plan-price"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      price: event.target.value,
                    })
                  }
                  placeholder="1000"
                  className="w-full rounded-xl border border-white/[0.09] bg-[#0b0f0e] py-3.5 pl-9 pr-4 text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#53625e] focus:border-[#5eead4]/50 focus:ring-4 focus:ring-[#5eead4]/[0.07]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="plan-duration"
                className="mb-2 block text-sm font-medium text-[#dbe5e2]"
              >
                Duration
              </label>

              <div className="relative">
                <input
                  id="plan-duration"
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={form.durationDays}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      durationDays: event.target.value,
                    })
                  }
                  placeholder="30"
                  className="w-full rounded-xl border border-white/[0.09] bg-[#0b0f0e] py-3.5 pl-4 pr-20 text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#53625e] focus:border-[#5eead4]/50 focus:ring-4 focus:ring-[#5eead4]/[0.07]"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[#657773]">
                  days
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#5eead4] px-6 py-3.5 text-sm font-bold text-[#0b0f0e] shadow-[0_8px_30px_rgba(94,234,212,0.12)] transition hover:bg-[#2dd4bf] hover:shadow-[0_8px_35px_rgba(94,234,212,0.18)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Plan"}
              </button>

              <button
                type="button"
                onClick={resetCreateForm}
                disabled={saving}
                className="rounded-xl border border-white/[0.09] bg-[#1b2421] px-6 py-3.5 text-sm font-semibold text-[#dbe5e2] transition hover:border-[#5eead4]/20 hover:bg-[#202c28] hover:text-[#f1f5f4] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-white/[0.07] bg-[#141a18] p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#f1f5f4]">
                Find a plan
              </h2>
              <p className="mt-1 text-xs text-[#657773]">
                Search by name or description and filter by status.
              </p>
            </div>

            <span className="hidden rounded-full border border-white/[0.08] bg-[#0b0f0e] px-3 py-1 text-xs text-[#657773] sm:block">
              {filteredPlans.length} result
              {filteredPlans.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex-1">
              <label htmlFor="plan-search" className="sr-only">
                Search plans
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#657773]">
                  ⌕
                </span>

                <input
                  id="plan-search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search plans by name or description..."
                  className="w-full rounded-xl border border-white/[0.09] bg-[#0b0f0e] py-3.5 pl-10 pr-4 text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#53625e] focus:border-[#5eead4]/50 focus:ring-4 focus:ring-[#5eead4]/[0.07]"
                />
              </div>
            </div>

            <div className="lg:w-52">
              <label
                htmlFor="plan-status-filter"
                className="sr-only"
              >
                Filter plans by status
              </label>

              <select
                id="plan-status-filter"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-white/[0.09] bg-[#0b0f0e] px-4 py-3.5 text-sm text-[#f1f5f4] outline-none transition focus:border-[#5eead4]/50 focus:ring-4 focus:ring-[#5eead4]/[0.07]"
              >
                <option value="all">All plans</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </section>

        {/* Plans List */}
        <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#141a18] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-2 border-b border-white/[0.07] bg-gradient-to-r from-white/[0.015] to-transparent px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <h2 className="font-semibold text-[#f1f5f4]">
                Available Plans
              </h2>

              <p className="mt-1 text-sm text-[#657773]">
                {filteredPlans.length} matching plan
                {filteredPlans.length !== 1 ? "s" : ""}
              </p>
            </div>

            <span className="rounded-full border border-white/[0.08] bg-[#0b0f0e] px-3 py-1.5 text-xs font-medium text-[#657773]">
              Page {page} of {pageCount}
            </span>
          </div>

          <div className="space-y-4 p-4 sm:p-6">
            {visiblePlans.map((plan) => {
              const isEditing = editingPlanId === plan._id;
              const isWorking = actionId === plan._id;

              return (
                <article
                  key={plan._id}
                  className={`group rounded-2xl border p-5 transition duration-300 ${
                    plan.isActive
                      ? "border-white/[0.07] bg-[#0b0f0e] hover:border-[#5eead4]/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.16)]"
                      : "border-white/[0.05] bg-[#101513] opacity-75"
                  }`}
                >
                  {isEditing ? (
                    <div>
                      <div className="mb-5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#5eead4]">
                            Editing plan
                          </p>
                          <h3 className="mt-1 text-lg font-semibold">
                            {plan.name}
                          </h3>
                        </div>

                        <span className="rounded-full border border-[#5eead4]/15 bg-[#5eead4]/[0.07] px-3 py-1 text-xs font-medium text-[#5eead4]">
                          Edit mode
                        </span>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label
                            htmlFor={`edit-name-${plan._id}`}
                            className="mb-2 block text-xs font-medium text-[#94a3a0]"
                          >
                            Plan Name
                          </label>

                          <input
                            id={`edit-name-${plan._id}`}
                            value={editForm.name}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                name: event.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-white/[0.09] bg-[#141a18] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition focus:border-[#5eead4]/50 focus:ring-4 focus:ring-[#5eead4]/[0.07]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`edit-description-${plan._id}`}
                            className="mb-2 block text-xs font-medium text-[#94a3a0]"
                          >
                            Description
                          </label>

                          <input
                            id={`edit-description-${plan._id}`}
                            value={editForm.description}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                description: event.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-white/[0.09] bg-[#141a18] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition focus:border-[#5eead4]/50 focus:ring-4 focus:ring-[#5eead4]/[0.07]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`edit-price-${plan._id}`}
                            className="mb-2 block text-xs font-medium text-[#94a3a0]"
                          >
                            Price
                          </label>

                          <input
                            id={`edit-price-${plan._id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.price}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                price: event.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-white/[0.09] bg-[#141a18] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition focus:border-[#5eead4]/50 focus:ring-4 focus:ring-[#5eead4]/[0.07]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`edit-duration-${plan._id}`}
                            className="mb-2 block text-xs font-medium text-[#94a3a0]"
                          >
                            Duration in Days
                          </label>

                          <input
                            id={`edit-duration-${plan._id}`}
                            type="number"
                            min="1"
                            step="1"
                            value={editForm.durationDays}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                durationDays: event.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-white/[0.09] bg-[#141a18] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition focus:border-[#5eead4]/50 focus:ring-4 focus:ring-[#5eead4]/[0.07]"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1 md:col-span-2">
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => saveEdit(plan._id)}
                            className="rounded-xl bg-[#5eead4] px-5 py-2.5 text-sm font-bold text-[#0b0f0e] transition hover:bg-[#2dd4bf] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isWorking ? "Saving..." : "Save Changes"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingPlanId(null)}
                            disabled={isWorking}
                            className="rounded-xl border border-white/[0.09] bg-[#1b2421] px-5 py-2.5 text-sm font-medium text-[#dbe5e2] transition hover:bg-[#202c28] disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold tracking-tight text-[#f1f5f4]">
                            {plan.name}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              plan.isActive
                                ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
                                : "border-amber-400/20 bg-amber-400/[0.08] text-amber-300"
                            }`}
                          >
                            {plan.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <p className="max-w-3xl text-sm leading-6 text-[#94a3a0]">
                          {plan.description}
                        </p>

                        <div className="mt-5 grid max-w-xl grid-cols-2 gap-3">
                          <div className="rounded-xl border border-[#5eead4]/10 bg-[#5eead4]/[0.04] px-4 py-3">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-[#657773]">
                              Price
                            </p>

                            <p className="mt-1 text-lg font-bold text-[#5eead4]">
                              ৳{plan.price.toLocaleString()}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/[0.07] bg-[#141a18] px-4 py-3">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-[#657773]">
                              Duration
                            </p>

                            <p className="mt-1 text-lg font-bold text-[#f1f5f4]">
                              {plan.durationDays}{" "}
                              <span className="text-sm font-medium text-[#657773]">
                                days
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => beginEdit(plan)}
                          className="rounded-xl border border-white/[0.09] bg-[#1b2421] px-4 py-2.5 text-sm font-semibold text-[#dbe5e2] transition hover:border-[#5eead4]/30 hover:bg-[#5eead4]/10 hover:text-[#5eead4]"
                        >
                          Edit
                        </button>

                        {plan.isActive && (
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => deactivatePlan(plan._id)}
                            className="rounded-xl border border-rose-400/15 bg-rose-400/[0.04] px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isWorking ? "Working..." : "Deactivate"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {!visiblePlans.length && (
              <div className="rounded-2xl border border-dashed border-white/[0.09] bg-[#0b0f0e] px-6 py-16 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#5eead4]/20 bg-[#5eead4]/[0.07] text-lg font-bold text-[#5eead4]">
                  P
                </div>

                <h3 className="font-semibold text-[#f1f5f4]">
                  {plans.length
                    ? "No plans match your filters"
                    : "No plans created yet"}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#657773]">
                  {plans.length
                    ? "Try changing your search text or status filter."
                    : "Create your first membership plan using the form above."}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredPlans.length > pageSize && (
            <div className="flex flex-col gap-4 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="text-sm text-[#657773]">
                Page{" "}
                <span className="font-semibold text-[#94a3a0]">
                  {page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#94a3a0]">
                  {pageCount}
                </span>
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  className="rounded-xl border border-white/[0.09] bg-[#141a18] px-4 py-2.5 text-sm font-semibold text-[#94a3a0] transition hover:border-[#5eead4]/30 hover:bg-[#5eead4]/10 hover:text-[#5eead4] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>

                <button
                  type="button"
                  disabled={page >= pageCount}
                  onClick={() => setPage((value) => value + 1)}
                  className="rounded-xl border border-white/[0.09] bg-[#141a18] px-4 py-2.5 text-sm font-semibold text-[#94a3a0] transition hover:border-[#5eead4]/30 hover:bg-[#5eead4]/10 hover:text-[#5eead4] disabled:cursor-not-allowed disabled:opacity-40"
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