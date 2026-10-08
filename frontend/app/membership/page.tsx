"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  createMembership,
  getActiveMembershipPlans,
  MembershipPlan,
} from "@/lib/api";

export default function MembershipPage() {
  const router = useRouter();

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectingPlan, setSelectingPlan] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true);
        setError("");

        const response = await getActiveMembershipPlans();

        setPlans(response.plans);
      } catch (loadError) {
        console.error(
          "Failed to load membership plans:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load membership plans"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPlans();
  }, []);

  async function choosePlan(planId: string) {
    try {
      setSelectingPlan(planId);
      setError("");

      await createMembership(planId);

      router.push("/membership/payment");
    } catch (selectError) {
      const message =
        selectError instanceof Error
          ? selectError.message
          : "Unable to select this plan";

      if (message === "Authentication required") {
        router.push("/login");
      } else if (
        message.includes(
          "already have an active or pending membership"
        )
      ) {
        router.push("/dashboard");
      } else {
        setError(message);
      }
    } finally {
      setSelectingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0f0e] px-4 py-8 text-[#f1f5f4] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <section className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#5eead4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4] shadow-[0_0_8px_rgba(94,234,212,0.8)]" />
            E-Membership
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Choose Your Membership
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#94a3a0] sm:text-base">
            Select the membership plan that works best for you.
            Your membership will remain active for the selected
            duration.
          </p>
        </section>

        {/* Loading */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-3xl border border-white/[0.08] bg-[#141a18] p-7"
              >
                <div className="animate-pulse space-y-5">
                  <div className="h-6 w-20 rounded-full bg-[#1b2421]" />
                  <div className="h-8 w-40 rounded bg-[#1b2421]" />
                  <div className="h-12 rounded bg-[#1b2421]" />
                  <div className="h-10 w-48 rounded bg-[#1b2421]" />
                  <div className="h-px bg-[#1b2421]" />
                  <div className="space-y-3">
                    <div className="h-5 rounded bg-[#1b2421]" />
                    <div className="h-5 rounded bg-[#1b2421]" />
                    <div className="h-5 rounded bg-[#1b2421]" />
                  </div>
                  <div className="h-11 rounded-xl bg-[#1b2421]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && plans.length === 0 && (
          <div className="mx-auto max-w-xl rounded-2xl border border-rose-400/20 bg-rose-400/10 p-6 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300">
              !
            </div>

            <h2 className="mt-4 text-lg font-semibold text-rose-300">
              Unable to load plans
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#94a3a0]">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-[#5eead4] px-5 py-2.5 text-sm font-semibold text-[#0b0f0e] transition hover:bg-[#2dd4bf]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Existing error with plans */}
        {!loading && error && plans.length > 0 && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-center text-sm text-rose-300"
          >
            {error}
          </div>
        )}

        {/* No plans */}
        {!loading && !error && plans.length === 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#141a18] p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1b2421] text-xl text-[#5eead4]">
              —
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No membership plans available
            </h2>

            <p className="mt-2 text-sm text-[#657773]">
              Please check again later.
            </p>
          </div>
        )}

        {/* Plans */}
        {!loading && !error && plans.length > 0 && (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan._id}
                  className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#141a18] p-7 shadow-[0_16px_50px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:border-[#5eead4]/30 hover:bg-[#171e1c]"
                >
                  {/* Glow */}
                  <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-[#5eead4]/5 blur-3xl transition duration-300 group-hover:bg-[#5eead4]/10" />

                  <div className="relative">
                    {/* Top row */}
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        Active
                      </span>

                      <span className="rounded-full bg-[#1b2421] px-3 py-1 text-xs font-medium text-[#94a3a0]">
                        {plan.durationDays} days
                      </span>
                    </div>

                    {/* Plan name */}
                    <h2 className="mt-7 text-2xl font-bold tracking-tight">
                      {plan.name}
                    </h2>

                    {/* Description */}
                    <p className="mt-3 min-h-12 text-sm leading-6 text-[#94a3a0]">
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mt-7 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-4xl font-bold tracking-tight text-[#f1f5f4]">
                        ৳{plan.price.toLocaleString("en-BD")}
                      </span>

                      <span className="text-sm text-[#657773]">
                        / {plan.durationDays} days
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="my-7 h-px bg-white/[0.08]" />

                    {/* Features */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm text-[#c5d0cd]">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5eead4]/10 text-xs font-bold text-[#5eead4]">
                          ✓
                        </span>

                        Active membership access
                      </div>

                      <div className="flex items-center gap-3 text-sm text-[#c5d0cd]">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5eead4]/10 text-xs font-bold text-[#5eead4]">
                          ✓
                        </span>

                        Membership validity tracking
                      </div>

                      <div className="flex items-center gap-3 text-sm text-[#c5d0cd]">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5eead4]/10 text-xs font-bold text-[#5eead4]">
                          ✓
                        </span>

                        Certificate support
                      </div>
                    </div>

                    {/* Choose button */}
                    <button
                      type="button"
                      onClick={() => void choosePlan(plan._id)}
                      disabled={selectingPlan !== null}
                      className="mt-8 flex w-full items-center justify-center rounded-xl bg-[#5eead4] px-5 py-3 text-sm font-bold text-[#0b0f0e] shadow-[0_8px_24px_rgba(94,234,212,0.10)] transition hover:bg-[#2dd4bf] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {selectingPlan === plan._id
                        ? "Starting membership..."
                        : "Choose Plan"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Renewal information */}
            <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-[#5eead4]/10 bg-[#141a18] p-5 text-center">
              <p className="text-sm leading-6 text-[#94a3a0]">
                Membership renewal starts with a new plan selection.
                After payment is completed and approved, your new
                membership will become active and a new certificate
                will be issued.
              </p>
            </div>
          </>
        )}

        {/* Back */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#657773] transition hover:text-[#5eead4]"
          >
            <span>←</span>
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}