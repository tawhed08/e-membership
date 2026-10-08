"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyCertificateLookupPage() {
  const router = useRouter();

  const [certificateId, setCertificateId] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = certificateId.trim();

    if (!normalized) {
      setError("Enter a certificate ID to continue.");
      return;
    }

    if (normalized.length > 100) {
      setError("Certificate IDs must be 100 characters or fewer.");
      return;
    }

    router.push(`/verify/${encodeURIComponent(normalized)}`);
  }

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-[#0b0f0e] px-4 py-14 text-[#f1f5f4] sm:py-20">
      {/* Background atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-teal-400/8 blur-3xl" />
        <div className="absolute bottom-[-180px] left-[-120px] h-[340px] w-[340px] rounded-full bg-emerald-400/5 blur-3xl" />
        <div className="absolute right-[-120px] top-1/3 h-[300px] w-[300px] rounded-full bg-cyan-400/5 blur-3xl" />
      </div>

      <section className="relative w-full max-w-xl animate-float-in">
        {/* Header */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-300/10 shadow-[0_0_40px_rgba(94,234,212,0.08)]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-8 w-8 text-teal-300"
            >
              <path
                d="M12 3l7 3v5.5c0 4.6-2.9 7.8-7 9.5-4.1-1.7-7-4.9-7-9.5V6l7-3z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 12l2.2 2.2L15.5 9.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
            E-Membership
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Verify a certificate
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#94a3a0]">
            Confirm the authenticity of an E-Membership certificate using its
            unique certificate ID.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-[#141a18]/95 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          {/* Trust indicator */}
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-teal-300/10 bg-teal-300/5 p-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-300/10 text-teal-300">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
              >
                <path
                  d="M12 3l7 3v5.5c0 4.6-2.9 7.8-7 9.5-4.1-1.7-7-4.9-7-9.5V6l7-3z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#dce7e4]">
                Official certificate lookup
              </p>
              <p className="mt-1 text-xs leading-5 text-[#657773]">
                Use the certificate ID printed on the document or provided by
                the certificate holder.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label
                htmlFor="certificateId"
                className="mb-2 block text-sm font-medium text-[#dce7e4]"
              >
                Certificate ID
              </label>

              <div className="relative">
                <input
                  id="certificateId"
                  autoComplete="off"
                  maxLength={100}
                  value={certificateId}
                  onChange={(event) => {
                    setCertificateId(event.target.value);
                    setError("");
                  }}
                  placeholder="e.g. EM-..."
                  className="w-full rounded-xl border border-white/10 bg-[#0b0f0e] px-4 py-3.5 font-mono text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#657773] hover:border-white/15 focus:border-teal-300/60 focus:ring-4 focus:ring-teal-300/10"
                />
              </div>

              <p className="mt-2 text-xs text-[#657773]">
                Enter up to 100 characters.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm leading-5 text-rose-300"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="mt-0.5 h-5 w-5 shrink-0"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    strokeLinecap="round"
                    d="M12 8v4"
                  />
                  <path
                    strokeLinecap="round"
                    d="M12 16h.01"
                  />
                </svg>

                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="group w-full rounded-xl bg-teal-300 px-5 py-3.5 font-semibold text-[#0b0f0e] shadow-lg shadow-teal-300/10 transition hover:bg-teal-200 hover:shadow-teal-300/20 focus:outline-none focus:ring-4 focus:ring-teal-300/20"
            >
              <span className="flex items-center justify-center gap-2">
                Verify certificate

                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                >
                  <path
                    d="M4 10h11M11 6l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </form>
        </div>

        {/* Footer note */}
        <div className="mt-5 text-center">
          <p className="text-xs leading-5 text-[#657773]">
            Certificate verification is publicly available and does not
            require an account.
          </p>
        </div>
      </section>
    </main>
  );
}