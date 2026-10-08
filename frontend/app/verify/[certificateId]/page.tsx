"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

interface CertificateUser {
  name: string;
}

interface CertificateMembership {
  status: string;
  paymentStatus: string;
  expiryDate?: string;
  startDate?: string;
}

interface CertificateData {
  _id?: string;
  certificateId: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  user?: CertificateUser;
  membership?: CertificateMembership;
}

interface VerifyResponse {
  success: boolean;
  verified: boolean;
  certificate?: CertificateData;
  message?: string;
}

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export default function VerifyCertificatePage() {
  const params = useParams();
  const { showToast } = useToast();

  const certificateId = String(params?.certificateId || "");

  const [certificate, setCertificate] =
    useState<CertificateData | null>(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyCertificate() {
      if (!certificateId) {
        setError("Certificate ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const url =
          `${API_URL}/certificates/verify/` +
          encodeURIComponent(certificateId);

        const response = await fetch(url);

        let data: VerifyResponse;

        try {
          data = await response.json();
        } catch {
          throw new Error("Backend returned an invalid response.");
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Certificate verification failed."
          );
        }

        if (!data.certificate) {
          throw new Error(
            "Certificate information was not returned."
          );
        }

        if (!cancelled) {
          setCertificate(data.certificate);
          setVerified(Boolean(data.verified));
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof TypeError) {
          setError(
            "Cannot connect to the E-Membership server. Make sure the backend is running on port 5000."
          );
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Certificate verification failed.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    verifyCertificate();

    return () => {
      cancelled = true;
    };
  }, [certificateId]);

  async function copyCertificateId() {
    try {
      await navigator.clipboard.writeText(certificateId);
      setCopied(true);
      showToast("Certificate ID copied.", "success");

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (copyError) {
      setError(
        copyError instanceof Error
          ? copyError.message
          : "Unable to copy certificate ID"
      );
    }
  }

  function formatDate(value?: string) {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-[#0b0f0e] px-6 text-[#f1f5f4]">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300/5 blur-3xl"
        />

        <div className="relative text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-300/10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-teal-300" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
            E-Membership
          </p>

          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
            Verifying certificate
          </h1>

          <p className="mt-2 text-sm text-[#94a3a0]">
            Please wait while we verify the certificate.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-[#0b0f0e] px-6 py-16 text-[#f1f5f4]">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-400/5 blur-3xl"
        />

        <section className="relative w-full max-w-lg animate-float-in rounded-3xl border border-white/10 bg-[#141a18]/95 p-7 text-center shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-8 w-8"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M12 8v4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M12 16h.01"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-rose-300">
            Verification error
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Verification failed
          </h1>

          <p className="mt-4 leading-7 text-[#94a3a0]">
            {error}
          </p>

          <div className="mt-6 rounded-2xl border border-white/8 bg-[#0b0f0e] p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#657773]">
              Certificate ID
            </p>

            <p className="mt-2 break-all font-mono text-sm text-teal-300">
              {certificateId || "Not provided"}
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!certificate) {
    return (
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-[#0b0f0e] px-6 py-16 text-[#f1f5f4]">
        <section className="w-full max-w-lg animate-float-in rounded-3xl border border-white/10 bg-[#141a18]/95 p-8 text-center shadow-2xl shadow-black/30">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-300">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-8 w-8"
            >
              <path
                d="M7 3h7l4 4v14H7V3z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M14 3v5h4M10 13h4M10 17h4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-bold">
            Certificate not found
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#94a3a0]">
            No certificate information is available for this request.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0b0f0e] px-4 py-12 text-[#f1f5f4] sm:px-6 sm:py-16">
      {/* Background atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-220px] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-teal-300/7 blur-3xl" />
        <div className="absolute bottom-[-180px] left-[-120px] h-[360px] w-[360px] rounded-full bg-emerald-300/5 blur-3xl" />
        <div className="absolute right-[-120px] top-1/3 h-[300px] w-[300px] rounded-full bg-cyan-300/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl animate-float-in">
        {/* Header */}
        <header className="mb-8 text-center">
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
            Certificate verification
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#94a3a0]">
            Official membership certificate verification result
          </p>
        </header>

        {/* Verification result */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#141a18]/95 shadow-2xl shadow-black/30 backdrop-blur-xl">
          {/* Status */}
          <div
            className={
              verified
                ? "border-b border-emerald-300/10 bg-emerald-300/5 p-7 text-center sm:p-9"
                : "border-b border-rose-300/10 bg-rose-300/5 p-7 text-center sm:p-9"
            }
          >
            <div
              className={
                verified
                  ? "mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10 text-emerald-300"
                  : "mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-rose-300/20 bg-rose-300/10 text-rose-300"
              }
            >
              {verified ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-10 w-10"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M8 12l2.5 2.5L16 9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-10 w-10"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M9 9l6 6M15 9l-6 6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>

            <h2
              className={
                verified
                  ? "mt-5 text-2xl font-bold text-emerald-300 sm:text-3xl"
                  : "mt-5 text-2xl font-bold text-rose-300 sm:text-3xl"
              }
            >
              {verified
                ? "Certificate verified"
                : "Certificate invalid"}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#94a3a0]">
              {verified
                ? "This certificate is currently active and valid."
                : "This certificate is not currently valid."}
            </p>
          </div>

          {/* Certificate information */}
          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            {/* Member */}
            <div className="rounded-2xl border border-white/8 bg-[#0b0f0e]/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#657773]">
                Member name
              </p>

              <p className="mt-2 text-lg font-semibold text-[#f1f5f4]">
                {certificate.user?.name || "N/A"}
              </p>
            </div>

            {/* Certificate ID */}
            <div className="rounded-2xl border border-white/8 bg-[#0b0f0e]/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#657773]">
                Certificate ID
              </p>

              <p className="mt-2 break-all font-mono text-sm font-semibold text-teal-300">
                {certificate.certificateId}
              </p>

              <button
                type="button"
                onClick={() => void copyCertificateId()}
                className="mt-3 rounded-lg border border-teal-300/15 bg-teal-300/5 px-3 py-1.5 text-xs font-semibold text-teal-300 transition hover:border-teal-300/30 hover:bg-teal-300/10 focus:outline-none focus:ring-2 focus:ring-teal-300/30"
              >
                {copied ? "Copied ✓" : "Copy ID"}
              </button>
            </div>

            {/* Certificate Status */}
            <div className="rounded-2xl border border-white/8 bg-[#0b0f0e]/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#657773]">
                Certificate status
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span
                  className={
                    verified
                      ? "h-2 w-2 rounded-full bg-emerald-300"
                      : "h-2 w-2 rounded-full bg-rose-300"
                  }
                />

                <p className="text-lg font-semibold capitalize">
                  {certificate.status}
                </p>
              </div>
            </div>

            {/* Issue Date */}
            <div className="rounded-2xl border border-white/8 bg-[#0b0f0e]/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#657773]">
                Issue date
              </p>

              <p className="mt-2 text-lg font-semibold">
                {formatDate(certificate.issueDate)}
              </p>
            </div>

            {/* Expiry Date */}
            <div className="rounded-2xl border border-white/8 bg-[#0b0f0e]/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#657773]">
                Expiry date
              </p>

              <p className="mt-2 text-lg font-semibold">
                {formatDate(certificate.expiryDate)}
              </p>
            </div>

            {/* Membership Status */}
            <div className="rounded-2xl border border-white/8 bg-[#0b0f0e]/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#657773]">
                Membership status
              </p>

              <p className="mt-2 text-lg font-semibold capitalize">
                {certificate.membership?.status || "N/A"}
              </p>
            </div>

            {/* Payment Status */}
            <div className="rounded-2xl border border-white/8 bg-[#0b0f0e]/60 p-5 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#657773]">
                Payment status
              </p>

              <p className="mt-2 text-lg font-semibold capitalize">
                {certificate.membership?.paymentStatus || "N/A"}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/8 bg-[#0b0f0e]/30 p-6 text-center">
            <div className="mx-auto flex max-w-2xl items-center justify-center gap-2 text-xs leading-5 text-[#657773]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 shrink-0 text-teal-300/70"
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

              <span>
                This certificate was verified through the official
                E-Membership system.
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}