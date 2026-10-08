"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  createPayment,
  getPaymentSettings,
  getMyMembership,
  getMyPayments,
  PaymentSettings,
  Payment,
  PaymentMethod,
  Membership,
  startCardCheckout,
} from "@/lib/api";

function PaymentMethodIcon({
  method,
}: {
  method: PaymentMethod;
}) {
  if (method === "card") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="flex h-7 items-center rounded-md border border-[#5eead4]/12 bg-white px-1.5 text-[9px] font-black tracking-tight text-blue-700">
          VISA
        </span>

        <span className="flex h-7 items-center rounded-md border border-[#5eead4]/12 bg-white px-1.5 text-[9px] font-black tracking-tight text-[#0b0f0e]">
          MC
        </span>
      </div>
    );
  }

  if (method === "bkash") {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e2136e] text-[11px] font-black text-white shadow-lg shadow-pink-500/10">
        bK
      </span>
    );
  }

  if (method === "nagad") {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f58220] text-[10px] font-black text-white shadow-lg shadow-orange-500/10">
        N
      </span>
    );
  }

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24322f] text-lg text-white">
      🏦
    </span>
  );
}

function getMethodName(method: PaymentMethod) {
  if (method === "bkash") return "bKash";
  if (method === "nagad") return "Nagad";
  if (method === "bank") return "Bank Transfer";
  return "Card";
}

export default function PaymentPage() {
  const [membership, setMembership] =
    useState<Membership | null>(null);

  const [payments, setPayments] =
    useState<Payment[]>([]);

  const [paymentSettings, setPaymentSettings] =
    useState<PaymentSettings | null>(null);

  const [method, setMethod] =
    useState<PaymentMethod>("bkash");

  const [transactionId, setTransactionId] =
    useState("");

  const [note, setNote] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          membershipResponse,
          paymentsResponse,
          settingsResponse,
        ] = await Promise.all([
          getMyMembership(),
          getMyPayments(),
          getPaymentSettings(),
        ]);

        const settings =
          settingsResponse.settings;

        setMembership(
          membershipResponse.membership
        );

        setPayments(
          paymentsResponse.payments
        );

        setPaymentSettings(settings);

        const firstAvailableMethod:
          | PaymentMethod
          | undefined = [
          settings.card.enabled
            ? "card"
            : undefined,
          settings.bkash.enabled
            ? "bkash"
            : undefined,
          settings.nagad.enabled
            ? "nagad"
            : undefined,
          settings.bank.enabled
            ? "bank"
            : undefined,
        ].find(
          (
            candidate
          ): candidate is PaymentMethod =>
            Boolean(candidate)
        );

        if (firstAvailableMethod) {
          setMethod(firstAvailableMethod);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load payment information";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadData();

    const gatewayResult =
      new URLSearchParams(
        window.location.search
      ).get("gateway");

    const feedbackTimer =
      window.setTimeout(() => {
        if (gatewayResult === "success") {
          setSuccess(
            "Card payment verified. Your membership is active."
          );
        } else if (gatewayResult === "failed") {
          setError(
            "Card payment was not completed. You can retry or choose another method."
          );
        } else if (
          gatewayResult === "verification-error"
        ) {
          setError(
            "Payment was received but could not yet be verified. Contact support before retrying."
          );
        }
      }, 0);

    return () =>
      window.clearTimeout(feedbackTimer);
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!membership) {
      setError("Membership not found.");
      return;
    }

    if (method === "card") {
      setError(
        "Use the secure card checkout button to continue."
      );
      return;
    }

    if (membership.status !== "pending") {
      setError(
        "This membership is no longer pending."
      );
      return;
    }

    if (!transactionId.trim()) {
      setError(
        "Please enter your transaction ID."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await createPayment({
        membershipId: membership._id,
        method,
        transactionId:
          transactionId.trim(),
        note: note.trim() || undefined,
      });

      setPayments((previous) => [
        response.payment,
        ...previous,
      ]);

      setSuccess(response.message);

      setTransactionId("");
      setNote("");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Payment submission failed";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCardCheckout() {
    if (
      !membership ||
      membership.status !== "pending"
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response =
        await startCardCheckout(
          membership._id
        );

      window.location.assign(
        response.checkoutUrl
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start secure card checkout"
      );

      setSubmitting(false);
    }
  }

  function getPlanName() {
    if (
      typeof membership?.plan === "object" &&
      membership.plan
    ) {
      return membership.plan.name;
    }

    return "Membership Plan";
  }

  function getPlanPrice() {
    if (
      typeof membership?.plan === "object" &&
      membership.plan
    ) {
      return membership.plan.price;
    }

    return 0;
  }

  function formatDate(date?: string) {
    if (!date) {
      return "—";
    }

    return new Date(
      date
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const availableMethods: Array<{
    id: PaymentMethod;
    label: string;
  }> = [];

  if (paymentSettings?.card.enabled) {
    availableMethods.push({
      id: "card",
      label: "Card",
    });
  }

  if (paymentSettings?.bkash.enabled) {
    availableMethods.push({
      id: "bkash",
      label: "bKash",
    });
  }

  if (paymentSettings?.nagad.enabled) {
    availableMethods.push({
      id: "nagad",
      label: "Nagad",
    });
  }

  if (paymentSettings?.bank.enabled) {
    availableMethods.push({
      id: "bank",
      label: "Bank Transfer",
    });
  }

  const selectedManualSettings =
    paymentSettings && method !== "card"
      ? paymentSettings[method]
      : null;

  const selectedBankSettings =
    paymentSettings?.bank ?? null;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080d0c] px-6 py-16 text-[#f1f5f4]">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse">
            <div className="mb-4 h-10 w-64 rounded-lg bg-[#1a2522]" />

            <div className="h-5 w-96 rounded bg-[#1a2522]" />

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="h-80 rounded-3xl bg-[#111917]" />
              <div className="h-80 rounded-3xl bg-[#111917]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080d0c] px-4 py-8 text-[#f1f5f4] sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#5eead4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
            Secure Payment
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#f1f5f4] sm:text-4xl">
            Complete Your Payment
          </h1>

          <p className="mt-3 max-w-2xl text-[#94a3a0]">
            Choose your preferred payment method and
            complete your membership payment securely.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-[#fb7185]/20 bg-[#fb7185]/10 px-5 py-4 text-sm text-[#fb7185]"
          >
            <span className="mt-0.5">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-[#34d399]/20 bg-[#34d399]/10 px-5 py-4 text-sm text-[#6ee7b7]"
          >
            <span className="mt-0.5">✓</span>
            <span>{success}</span>
          </div>
        )}

        {!membership ? (
          <div className="rounded-[28px] border border-[#5eead4]/12 bg-gradient-to-b from-[#151e1b] to-[#0f1513] p-8 text-center shadow-2xl shadow-black/30">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#5eead4]/15 bg-[#5eead4]/10 text-2xl">
              💳
            </div>

            <h2 className="mt-5 text-xl font-semibold text-[#f1f5f4]">
              No Membership Found
            </h2>

            <p className="mt-2 text-[#94a3a0]">
              Please choose a membership plan first.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">

            {/* Membership Summary */}
            <section className="rounded-[28px] border border-[#5eead4]/12 bg-gradient-to-b from-[#151e1b] to-[#0f1513] p-6 shadow-2xl shadow-black/30 ring-1 ring-inset ring-white/[0.025] sm:p-8">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[#71817d]">
                    Selected Plan
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-[#f1f5f4]">
                    {getPlanName()}
                  </h2>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                    membership.status === "active"
                      ? "border-[#34d399]/20 bg-[#34d399]/10 text-[#6ee7b7]"
                      : membership.status === "pending"
                        ? "border-[#f5c76b]/20 bg-[#f5c76b]/10 text-[#f5c76b]"
                        : "border-[#5eead4]/12 bg-[#24322f] text-[#94a3a0]"
                  }`}
                >
                  {membership.status}
                </span>
              </div>

              {/* Price */}
              <div className="relative overflow-hidden rounded-2xl border border-[#5eead4]/20 bg-gradient-to-br from-[#5eead4]/10 via-[#5eead4]/5 to-transparent p-6">
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#5eead4]/10 blur-2xl" />

                <p className="relative text-sm text-[#71817d]">
                  Membership Price
                </p>

                <p className="relative mt-1 text-4xl font-bold tracking-tight text-[#5eead4]">
                  ৳{getPlanPrice()}
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between gap-4 border-b border-[#5eead4]/12 pb-4">
                  <span className="text-[#71817d]">
                    Payment Status
                  </span>

                  <span className="font-medium capitalize text-[#e4eeeb]">
                    {membership.paymentStatus}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-b border-[#5eead4]/12 pb-4">
                  <span className="text-[#71817d]">
                    Start Date
                  </span>

                  <span className="text-[#e4eeeb]">
                    {formatDate(
                      membership.startDate
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#71817d]">
                    Expiry Date
                  </span>

                  <span className="text-[#e4eeeb]">
                    {formatDate(
                      membership.expiryDate
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-[#5eead4]/12 bg-[#080d0c]/70 p-4">
                <div className="flex gap-3">
                  <span className="mt-0.5 text-[#5eead4]">
                    🔒
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-[#e4eeeb]">
                      Secure payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#71817d]">
                      Card details are handled by the
                      secure payment gateway and are not
                      stored by E-Membership.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Form */}
            <section className="rounded-[28px] border border-[#5eead4]/12 bg-gradient-to-b from-[#151e1b] to-[#0f1513] p-6 shadow-2xl shadow-black/30 ring-1 ring-inset ring-white/[0.025] sm:p-8">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#5eead4]/15 bg-[#5eead4]/10 text-xl">
                    💳
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-[#f1f5f4]">
                      Payment Details
                    </h2>

                    <p className="mt-1 text-sm text-[#71817d]">
                      Select a payment method to continue.
                    </p>
                  </div>
                </div>
              </div>

              {membership.status !== "pending" ? (
                <div className="mt-8 rounded-2xl border border-[#34d399]/20 bg-[#34d399]/10 p-5">
                  <p className="font-semibold text-[#6ee7b7]">
                    This membership is already{" "}
                    {membership.status}.
                  </p>

                  <p className="mt-2 text-sm text-[#94a3a0]">
                    No additional payment is required
                    for this membership.
                  </p>
                </div>
              ) : availableMethods.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-[#f5c76b]/20 bg-[#f5c76b]/10 p-5 text-sm text-[#f8d98b]">
                  No payment methods are currently
                  available. Please contact the
                  membership team.
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="mt-8 space-y-6"
                >
                  {/* Payment Methods */}
                  <div>
                    <label className="mb-3 block text-sm font-medium text-[#c6d4d0]">
                      Payment Method
                    </label>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {availableMethods.map(
                        ({ id, label }) => {
                          const selected =
                            method === id;

                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() =>
                                setMethod(id)
                              }
                              className={`group relative flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-sm font-semibold transition ${
                                selected
                                  ? "border-[#5eead4]/50 bg-[#5eead4]/10 text-[#5eead4] shadow-lg shadow-[#5eead4]/5"
                                  : "border-[#5eead4]/12 bg-[#080d0c] text-[#94a3a0] hover:border-[#5eead4]/30 hover:bg-[#111917] hover:text-[#f1f5f4]"
                              }`}
                            >
                              {selected && (
                                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#5eead4] text-[10px] font-black text-[#0b0f0e]">
                                  ✓
                                </span>
                              )}

                              <PaymentMethodIcon
                                method={id}
                              />

                              <span>{label}</span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Card Checkout */}
                  {method === "card" ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-[#5eead4]/12 bg-[#080d0c]/70 p-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1a2522] text-xl">
                            💳
                          </div>

                          <div>
                            <p className="font-semibold text-[#e4eeeb]">
                              Secure Card Checkout
                            </p>

                            <p className="mt-1 text-sm leading-6 text-[#94a3a0]">
                              You will be redirected to
                              aamarPay&apos;s secure hosted
                              checkout page.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-black tracking-wide text-blue-700">
                            VISA
                          </span>

                          <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-black tracking-wide text-[#0b0f0e]">
                            Mastercard
                          </span>

                          <span className="rounded-lg border border-[#5eead4]/12 bg-[#111917] px-3 py-1.5 text-xs font-medium text-[#94a3a0]">
                            🔒 Secure Gateway
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void handleCardCheckout()
                        }
                        disabled={submitting}
                        className="w-full rounded-2xl bg-[#159e8c] px-5 py-4 font-bold text-white shadow-lg shadow-black/30 transition hover:bg-[#1bb7a2] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitting
                          ? "Opening secure checkout…"
                          : `Continue to card checkout — ৳${getPlanPrice()}`}
                      </button>

                      <p className="text-center text-xs text-[#71817d]">
                        Your card number, CVV and PIN
                        are never entered into or stored
                        by E-Membership.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Manual Payment Information */}
                      {selectedManualSettings && (
                        <div className="overflow-hidden rounded-2xl border border-[#5eead4]/12 bg-[#080d0c]/70">
                          {/* Header */}
                          <div className="border-b border-[#5eead4]/12 bg-[#111917]/70 px-5 py-5">
                            <div className="flex items-center gap-4">
                              <PaymentMethodIcon
                                method={method}
                              />

                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71817d]">
                                  Pay With
                                </p>

                                <p className="mt-1 text-lg font-bold text-[#f1f5f4]">
                                  {getMethodName(
                                    method
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-5">
                            {/* Amount */}
                            <div className="mb-5 rounded-2xl border border-[#5eead4]/20 bg-[#5eead4]/5 p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-wider text-[#71817d]">
                                    Amount to Pay
                                  </p>

                                  <p className="mt-1 text-2xl font-bold text-[#5eead4]">
                                    ৳{getPlanPrice()}
                                  </p>
                                </div>

                                <span className="rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 px-3 py-1 text-xs font-semibold text-[#5eead4]">
                                  Required
                                </span>
                              </div>
                            </div>

                            {/* bKash / Nagad */}
                            {(method === "bkash" ||
                              method === "nagad") && (
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-wider text-[#71817d]">
                                    Send Money To
                                  </p>

                                  <div className="mt-2 rounded-2xl border border-[#5eead4]/20 bg-[#5eead4]/5 px-4 py-4">
                                    <p className="break-all font-mono text-xl font-bold tracking-wide text-[#5eead4] sm:text-2xl">
                                      {
                                        selectedManualSettings.accountNumber
                                      }
                                    </p>
                                  </div>
                                </div>

                                {selectedManualSettings.accountName && (
                                  <div className="rounded-xl border border-[#5eead4]/12 bg-[#111917]/60 px-4 py-3">
                                    <p className="text-xs text-[#71817d]">
                                      Account Name
                                    </p>

                                    <p className="mt-1 font-medium text-[#f1f5f4]">
                                      {
                                        selectedManualSettings.accountName
                                      }
                                    </p>
                                  </div>
                                )}

                                <div className="rounded-xl border border-[#5eead4]/12 bg-[#111917]/60 px-4 py-3">
                                  <p className="text-xs text-[#71817d]">
                                    Payment Type
                                  </p>

                                  <p className="mt-1 font-medium text-[#e4eeeb]">
                                    Send Money
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Bank */}
                            {method === "bank" &&
                              selectedBankSettings && (
                                <div className="space-y-3">
                                  {selectedBankSettings.bankName && (
                                    <div className="rounded-xl border border-[#5eead4]/12 bg-[#111917]/60 px-4 py-3">
                                      <p className="text-xs text-[#71817d]">
                                        Bank Name
                                      </p>

                                      <p className="mt-1 font-semibold text-[#f1f5f4]">
                                        {
                                          selectedBankSettings.bankName
                                        }
                                      </p>
                                    </div>
                                  )}

                                  <div className="rounded-2xl border border-[#5eead4]/20 bg-[#5eead4]/5 px-4 py-4">
                                    <p className="text-xs font-medium uppercase tracking-wider text-[#71817d]">
                                      Bank Account Number
                                    </p>

                                    <p className="mt-1 break-all font-mono text-xl font-bold tracking-wide text-[#5eead4]">
                                      {
                                        selectedBankSettings.accountNumber
                                      }
                                    </p>
                                  </div>

                                  {selectedBankSettings.accountName && (
                                    <div className="rounded-xl border border-[#5eead4]/12 bg-[#111917]/60 px-4 py-3">
                                      <p className="text-xs text-[#71817d]">
                                        Account Name
                                      </p>

                                      <p className="mt-1 font-medium text-[#f1f5f4]">
                                        {
                                          selectedBankSettings.accountName
                                        }
                                      </p>
                                    </div>
                                  )}

                                  {selectedBankSettings.branch && (
                                    <div className="rounded-xl border border-[#5eead4]/12 bg-[#111917]/60 px-4 py-3">
                                      <p className="text-xs text-[#71817d]">
                                        Branch
                                      </p>

                                      <p className="mt-1 font-medium text-[#e4eeeb]">
                                        {
                                          selectedBankSettings.branch
                                        }
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                            {/* Instructions */}
                            {selectedManualSettings.instructions && (
                              <div className="mt-5 rounded-xl border border-[#f5c76b]/15 bg-[#f5c76b]/5 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#f5c76b]">
                                  Payment Instructions
                                </p>

                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#c6d4d0]">
                                  {
                                    selectedManualSettings.instructions
                                  }
                                </p>
                              </div>
                            )}

                            {/* Final instruction */}
                            <div className="mt-5 border-t border-[#5eead4]/12 pt-5">
                              <div className="flex gap-3">
                                <span className="mt-0.5 text-[#5eead4]">
                                  ✓
                                </span>

                                <p className="text-sm leading-6 text-[#94a3a0]">
                                  After sending{" "}
                                  <span className="font-semibold text-[#f1f5f4]">
                                    ৳{getPlanPrice()}
                                  </span>
                                  , enter the Transaction
                                  ID below and submit your
                                  payment for verification.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Transaction ID */}
                      <div>
                        <label
                          htmlFor="transactionId"
                          className="mb-2 block text-sm font-medium text-[#c6d4d0]"
                        >
                          Transaction ID
                        </label>

                        <input
                          id="transactionId"
                          type="text"
                          value={transactionId}
                          onChange={(event) =>
                            setTransactionId(
                              event.target.value
                            )
                          }
                          placeholder="Enter your transaction ID"
                          className="w-full rounded-2xl border border-[#5eead4]/12 bg-[#080d0c] px-4 py-3.5 text-[#f1f5f4] outline-none transition placeholder:text-[#5b6b67] focus:border-[#5eead4] focus:ring-2 focus:ring-[#5eead4]/10"
                        />

                        <p className="mt-2 text-xs text-[#71817d]">
                          Enter the transaction ID you
                          received after completing the
                          payment.
                        </p>
                      </div>

                      {/* Note */}
                      <div>
                        <label
                          htmlFor="note"
                          className="mb-2 block text-sm font-medium text-[#c6d4d0]"
                        >
                          Note
                          <span className="ml-1 text-[#5b6b67]">
                            (optional)
                          </span>
                        </label>

                        <textarea
                          id="note"
                          value={note}
                          onChange={(event) =>
                            setNote(
                              event.target.value
                            )
                          }
                          rows={3}
                          placeholder="Add a note if needed..."
                          className="w-full resize-none rounded-2xl border border-[#5eead4]/12 bg-[#080d0c] px-4 py-3.5 text-[#f1f5f4] outline-none transition placeholder:text-[#5b6b67] focus:border-[#5eead4] focus:ring-2 focus:ring-[#5eead4]/10"
                        />
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-2xl bg-[#159e8c] px-5 py-4 font-bold text-white shadow-lg shadow-[#5eead4]/10 transition hover:bg-[#1bb7a2] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitting
                          ? "Submitting Payment..."
                          : `Submit Payment — ৳${getPlanPrice()}`}
                      </button>
                    </>
                  )}
                </form>
              )}
            </section>
          </div>
        )}

        {/* Payment History */}
        <section className="mt-8 rounded-[28px] border border-[#5eead4]/12 bg-gradient-to-b from-[#151e1b] to-[#0f1513] p-6 shadow-2xl shadow-black/30 ring-1 ring-inset ring-white/[0.025] sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#f1f5f4]">
                Payment History
              </h2>

              <p className="mt-1 text-sm text-[#94a3a0]">
                Your recent payment submissions.
              </p>
            </div>

            <div className="hidden rounded-xl border border-[#5eead4]/12 bg-[#5eead4]/5 px-3 py-2 text-xs font-medium text-[#5eead4] sm:block">
              {payments.length}{" "}
              {payments.length === 1
                ? "Payment"
                : "Payments"}
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#5eead4]/12 bg-[#080d0c]/40 px-5 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#5eead4]/12 bg-[#5eead4]/5 text-xl">
                🧾
              </div>

              <p className="mt-4 text-sm font-medium text-[#c6d4d0]">
                No payment history yet.
              </p>

              <p className="mt-1 text-xs text-[#71817d]">
                Your payment submissions will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#5eead4]/8">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-[#080d0c]/60">
                  <tr className="border-b border-[#5eead4]/12 text-sm text-[#71817d]">
                    <th className="px-4 py-4 font-medium">
                      Date
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Method
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Transaction ID
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Amount
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="border-b border-[#5eead4]/8 text-sm transition hover:bg-[#5eead4]/[0.025] last:border-0"
                    >
                      <td className="px-4 py-4 text-[#94a3a0]">
                        {formatDate(
                          payment.createdAt
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <PaymentMethodIcon
                            method={payment.method}
                          />

                          <span className="capitalize text-[#e4eeeb]">
                            {payment.method === "bank"
                              ? "Bank"
                              : payment.method}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-mono text-xs text-[#94a3a0]">
                        {payment.transactionId}
                      </td>

                      <td className="px-4 py-4 font-semibold text-[#5eead4]">
                        ৳{payment.amount}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                            payment.status ===
                            "approved"
                              ? "border-[#34d399]/20 bg-[#34d399]/10 text-[#6ee7b7]"
                              : payment.status ===
                                  "rejected"
                                ? "border-[#fb7185]/20 bg-[#fb7185]/10 text-[#fb7185]"
                                : "border-[#f5c76b]/20 bg-[#f5c76b]/10 text-[#f5c76b]"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}