"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  getCurrentUser,
  getPaymentSettings,
  ManualPaymentMethodSettings,
  PaymentSettings,
  updatePaymentSettings,
} from "@/lib/api";

import { useToast } from "@/components/ToastProvider";
import LoadingSkeleton from "@/components/LoadingSkeleton";

const emptyManualSettings: ManualPaymentMethodSettings = {
  enabled: true,
  accountName: "",
  accountNumber: "",
  instructions: "",
};

const emptySettings: PaymentSettings = {
  bkash: { ...emptyManualSettings },
  nagad: { ...emptyManualSettings },
  bank: {
    ...emptyManualSettings,
    bankName: "",
    branch: "",
  },
  card: {
    enabled: false,
    provider: "aamarPay",
    gatewayConfigured: false,
  },
};

type ManualMethod =
  | "bkash"
  | "nagad"
  | "bank";

function MethodIcon({
  method,
}: {
  method: "bkash" | "nagad" | "bank" | "card";
}) {
  if (method === "bkash") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e2136e] text-sm font-black text-white shadow-lg shadow-[#e2136e]/10">
        bK
      </div>
    );
  }

  if (method === "nagad") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f58220] text-sm font-black text-white shadow-lg shadow-[#f58220]/10">
        N
      </div>
    );
  }

  if (method === "bank") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#5eead4]/10 bg-[#1b2421] text-xl">
        🏦
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#5eead4]/10 bg-[#1b2421] text-xl">
      💳
    </div>
  );
}

function getMethodDescription(
  method: ManualMethod
) {
  if (method === "bkash") {
    return "Configure the bKash destination members will use for payments.";
  }

  if (method === "nagad") {
    return "Configure the Nagad destination members will use for payments.";
  }

  return "Configure the bank account members will use for transfers.";
}

export default function AdminPaymentSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [settings, setSettings] =
    useState<PaymentSettings>(emptySettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const { user } =
          await getCurrentUser();

        if (cancelled) return;

        if (user.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        const response =
          await getPaymentSettings();

        if (cancelled) return;

        setSettings(response.settings);
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function updateManualMethod(
    method: ManualMethod,
    field: string,
    value: string | boolean
  ) {
    setSettings((current) => ({
      ...current,
      [method]: {
        ...current[method],
        [field]: value,
      },
    }));
  }

  async function saveSettings(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response =
        await updatePaymentSettings({
          bkash: settings.bkash,
          nagad: settings.nagad,
          bank: settings.bank,
          cardEnabled: settings.card.enabled,
        });

      setSettings(response.settings);

      showToast(
        response.message,
        "success"
      );
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Unable to save payment settings";

      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
        aria-busy="true"
        className="min-h-screen bg-[#0b0f0e] px-4 py-10 text-[#f1f5f4] sm:px-8"
      >
        <div className="mx-auto max-w-6xl space-y-5">
          <LoadingSkeleton className="h-10 w-72" />
          <LoadingSkeleton className="h-64 rounded-3xl" />
          <LoadingSkeleton className="h-64 rounded-3xl" />
        </div>
      </main>
    );
  }

  const methods = [
    {
      key: "bkash" as const,
      title: "bKash",
      icon: "bkash" as const,
    },
    {
      key: "nagad" as const,
      title: "Nagad",
      icon: "nagad" as const,
    },
    {
      key: "bank" as const,
      title: "Bank Transfer",
      icon: "bank" as const,
    },
  ];

  return (
    <main className="min-h-screen bg-[#0b0f0e] text-[#f1f5f4]">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0b0f0e]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() =>
              router.push("/admin")
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 font-bold text-[#5eead4]">
              E
            </div>

            <div className="text-left">
              <p className="font-bold tracking-tight">
                E-Membership
              </p>

              <p className="text-xs text-[#657773]">
                Admin Settings
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/admin")
            }
            className="rounded-xl border border-white/[0.10] px-4 py-2 text-sm font-medium text-[#94a3a0] transition hover:border-[#5eead4]/30 hover:bg-[#5eead4]/10 hover:text-[#5eead4]"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Heading */}
        <header className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#5eead4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
            Admin Settings
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Payment Settings
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#94a3a0]">
            Configure the payment destinations and
            checkout methods members see during
            membership payment.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={saveSettings}
          className="space-y-6"
        >
          {/* Manual Methods */}
          {methods.map(
            ({ key, title, icon }) => {
              const methodSettings =
                settings[key];

              const isBank =
                key === "bank";

              return (
                <section
                  key={key}
                  className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#141a18] shadow-2xl shadow-black/20"
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-7">
                    <div className="flex items-center gap-4">
                      <MethodIcon method={icon} />

                      <div>
                        <h2 className="text-lg font-bold">
                          {title}
                        </h2>

                        <p className="mt-1 text-xs text-[#657773]">
                          {getMethodDescription(
                            key
                          )}
                        </p>
                      </div>
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0b0f0e] px-3 py-2.5 text-sm text-[#94a3a0]">
                      <input
                        type="checkbox"
                        checked={
                          methodSettings.enabled
                        }
                        onChange={(event) =>
                          updateManualMethod(
                            key,
                            "enabled",
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 accent-[#5eead4]"
                      />

                      <span>
                        {methodSettings.enabled
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </label>
                  </div>

                  <div className="p-5 sm:p-7">
                    {/* Member Preview Notice */}
                    <div className="mb-6 rounded-2xl border border-[#5eead4]/10 bg-[#5eead4]/5 p-4">
                      <div className="flex gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5eead4]/10 text-xs font-bold text-[#5eead4]">
                          i
                        </span>

                        <div>
                          <p className="text-sm font-semibold text-[#f1f5f4]">
                            Member-facing payment
                            details
                          </p>

                          <p className="mt-1 text-xs leading-5 text-[#657773]">
                            These details appear on the
                            membership payment page. Double
                            check the payment number or bank
                            account before saving.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      {/* Bank Name */}
                      {isBank && (
                        <label className="block">
                          <span className="text-sm font-medium text-[#cbd5d2]">
                            Bank Name
                          </span>

                          <input
                            value={
                              settings.bank
                                .bankName
                            }
                            onChange={(event) =>
                              updateManualMethod(
                                "bank",
                                "bankName",
                                event.target.value
                              )
                            }
                            maxLength={120}
                            placeholder="e.g. Dutch-Bangla Bank"
                            className="mt-2 w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-[#f1f5f4] outline-none transition placeholder:text-[#657773] focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
                          />
                        </label>
                      )}

                      {/* Account Name */}
                      <label className="block">
                        <span className="text-sm font-medium text-[#cbd5d2]">
                          Account Name
                        </span>

                        <input
                          value={
                            methodSettings.accountName
                          }
                          onChange={(event) =>
                            updateManualMethod(
                              key,
                              "accountName",
                              event.target.value
                            )
                          }
                          maxLength={120}
                          placeholder="Name of the account holder"
                          className="mt-2 w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-[#f1f5f4] outline-none transition placeholder:text-[#657773] focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
                        />
                      </label>

                      {/* Account Number */}
                      <label className="block">
                        <span className="text-sm font-medium text-[#cbd5d2]">
                          {isBank
                            ? "Bank Account Number"
                            : `${title} Payment Number`}
                        </span>

                        <input
                          value={
                            methodSettings.accountNumber
                          }
                          onChange={(event) =>
                            updateManualMethod(
                              key,
                              "accountNumber",
                              event.target.value
                            )
                          }
                          maxLength={120}
                          placeholder={
                            isBank
                              ? "Enter bank account number"
                              : `Enter ${title} number`
                          }
                          className="mt-2 w-full rounded-xl border border-[#5eead4]/15 bg-[#0b0f0e] px-4 py-3 font-mono text-[#f1f5f4] outline-none transition placeholder:font-sans placeholder:text-[#657773] focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
                        />

                        <p className="mt-2 text-xs text-[#657773]">
                          {isBank
                            ? "This account number will be shown as the payment destination."
                            : `Members will send their payment to this ${title} number.`}
                        </p>
                      </label>

                      {/* Branch */}
                      {isBank && (
                        <label className="block">
                          <span className="text-sm font-medium text-[#cbd5d2]">
                            Branch
                          </span>

                          <input
                            value={
                              settings.bank
                                .branch
                            }
                            onChange={(event) =>
                              updateManualMethod(
                                "bank",
                                "branch",
                                event.target.value
                              )
                            }
                            maxLength={120}
                            placeholder="e.g. Dhanmondi Branch"
                            className="mt-2 w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-[#f1f5f4] outline-none transition placeholder:text-[#657773] focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
                          />
                        </label>
                      )}

                      {/* Instructions */}
                      <label className="block sm:col-span-2">
                        <span className="text-sm font-medium text-[#cbd5d2]">
                          Payment Instructions
                        </span>

                        <textarea
                          value={
                            methodSettings.instructions
                          }
                          onChange={(event) =>
                            updateManualMethod(
                              key,
                              "instructions",
                              event.target.value
                            )
                          }
                          maxLength={1000}
                          rows={5}
                          placeholder={
                            isBank
                              ? "Example: Transfer the membership fee to the account above. After payment, enter the transaction/reference ID below."
                              : `Example: Send the exact membership amount to the ${title} number above. After payment, enter the transaction ID below.`
                          }
                          className="mt-2 w-full resize-y rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-sm leading-6 text-[#f1f5f4] outline-none transition placeholder:text-[#657773] focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
                        />

                        <p className="mt-2 text-xs text-[#657773]">
                          Keep the instructions short,
                          clear, and easy to follow.
                        </p>
                      </label>
                    </div>
                  </div>
                </section>
              );
            }
          )}

          {/* Card */}
          <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#141a18] shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-7">
              <div className="flex items-center gap-4">
                <MethodIcon method="card" />

                <div>
                  <h2 className="text-lg font-bold">
                    Card Checkout
                  </h2>

                  <p className="mt-1 text-xs text-[#657773]">
                    Secure hosted checkout via{" "}
                    {settings.card.provider}.
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0b0f0e] px-3 py-2.5 text-sm text-[#94a3a0]">
                <input
                  type="checkbox"
                  checked={
                    settings.card.enabled
                  }
                  onChange={(event) =>
                    setSettings(
                      (current) => ({
                        ...current,
                        card: {
                          ...current.card,
                          enabled:
                            event.target.checked,
                        },
                      })
                    )
                  }
                  className="h-4 w-4 accent-[#5eead4]"
                />

                <span>
                  {settings.card.enabled
                    ? "Enabled"
                    : "Disabled"}
                </span>
              </label>
            </div>

            <div className="p-5 sm:p-7">
              <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f0e] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5eead4]/10 text-[#5eead4]">
                    ✓
                  </div>

                  <div>
                    <p className="font-semibold text-[#f1f5f4]">
                      Secure hosted checkout
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[#657773]">
                      Members are redirected to the
                      payment provider&apos;s secure
                      checkout. Card numbers and security
                      codes are not entered into or stored by
                      E-Membership.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      settings.card
                        .gatewayConfigured
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                        : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                    }`}
                  >
                    {settings.card.gatewayConfigured
                      ? "Gateway configured"
                      : "Gateway configuration missing"}
                  </span>

                  <span className="rounded-full border border-white/[0.08] bg-[#141a18] px-3 py-1.5 text-xs text-[#657773]">
                    Provider:{" "}
                    {settings.card.provider}
                  </span>
                </div>
              </div>

              {!settings.card.gatewayConfigured && (
                <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <p className="text-sm font-semibold text-amber-200">
                    Card checkout is not fully configured
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-200/70">
                    Add the required{" "}
                    {settings.card.provider} credentials
                    and public backend URL to the backend
                    environment before enabling card
                    checkout.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Save Area */}
          <div className="flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-[#141a18] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm font-semibold text-[#f1f5f4]">
                Ready to save?
              </p>

              <p className="mt-1 text-xs leading-5 text-[#657773]">
                Changes affect the payment options shown
                to members after saving.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#5eead4] px-6 py-3 text-sm font-bold text-[#0b0f0e] shadow-lg shadow-[#5eead4]/10 transition hover:bg-[#2dd4bf] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Payment Settings"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}