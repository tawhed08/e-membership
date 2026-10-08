"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface CertificateUser {
  name: string;
  email: string;
}

interface CertificateMembership {
  status: string;
  paymentStatus: string;
}

interface CertificateData {
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

const API_URL = "http://localhost:5000/api";

export default function VerifyCertificatePage() {
  const params = useParams();

  const certificateId = String(
    params?.certificateId || ""
  );

  const [certificate, setCertificate] =
    useState<CertificateData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!certificateId) {
      setError("Certificate ID is missing.");
      setLoading(false);
      return;
    }

    async function verifyCertificate() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/certificates/verify/${encodeURIComponent(
            certificateId
          )}`
        );

        const data: VerifyResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Certificate verification failed."
          );
        }

        if (!data.certificate) {
          throw new Error(
            "Certificate information was not found."
          );
        }

        setCertificate(data.certificate);
        setVerified(Boolean(data.verified));
      } catch (err) {
        if (err instanceof TypeError) {
          setError(
            "Cannot connect to the backend. Make sure the backend is running on port 5000."
          );
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Certificate verification failed."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    verifyCertificate();
  }, [certificateId]);

  function formatDate(dateValue?: string) {
    if (!dateValue) {
      return "N/A";
    }

    const date = new Date(dateValue);

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
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-cyan-400" />

          <h1 className="text-2xl font-bold">
            Verifying Certificate
          </h1>

          <p className="mt-2 text-slate-400">
            Please wait while we verify the certificate.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-white/5 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-3xl text-red-400">
            !
          </div>

          <h1 className="text-2xl font-bold">
            Verification Failed
          </h1>

          <p className="mt-4 leading-7 text-slate-400">
            {error}
          </p>

          <div className="mt-6 rounded-xl bg-black/20 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Certificate ID
            </p>

            <p className="mt-2 break-all font-mono text-sm text-cyan-400">
              {certificateId || "Not provided"}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!certificate) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-3xl border border-red-500/20 bg-white/5 p-8 text-center">
          <h1 className="text-2xl font-bold">
            Certificate Not Found
          </h1>

          <p className="mt-3 text-slate-400">
            No certificate information is available.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            E-Membership
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Certificate Verification
          </h1>

          <p className="mt-3 text-slate-400">
            Official membership certificate verification
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
          <div
            className={
              verified
                ? "bg-emerald-500/10 p-8 text-center"
                : "bg-red-500/10 p-8 text-center"
            }
          >
            <div
              className={
                verified
                  ? "mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-5xl text-emerald-400"
                  : "mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-5xl text-red-400"
              }
            >
              {verified ? "✓" : "✕"}
            </div>

            <h2
              className={
                verified
                  ? "mt-5 text-3xl font-bold text-emerald-400"
                  : "mt-5 text-3xl font-bold text-red-400"
              }
            >
              {verified
                ? "Certificate Verified"
                : "Certificate Invalid"}
            </h2>

            <p className="mt-3 text-slate-400">
              {verified
                ? "This certificate is currently active and valid."
                : "This certificate is not currently valid."}
            </p>
          </div>

          <div className="grid gap-6 p-8 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">
                Member Name
              </p>

              <p className="mt-1 text-lg font-semibold">
                {certificate.user?.name || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Email
              </p>

              <p className="mt-1 break-all text-lg font-semibold">
                {certificate.user?.email || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Certificate ID
              </p>

              <p className="mt-1 break-all font-mono text-sm font-semibold text-cyan-400">
                {certificate.certificateId}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Certificate Status
              </p>

              <p className="mt-1 text-lg font-semibold capitalize">
                {certificate.status}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Issue Date
              </p>

              <p className="mt-1 text-lg font-semibold">
                {formatDate(certificate.issueDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Expiry Date
              </p>

              <p className="mt-1 text-lg font-semibold">
                {formatDate(certificate.expiryDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Membership Status
              </p>

              <p className="mt-1 text-lg font-semibold capitalize">
                {certificate.membership?.status || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Payment Status
              </p>

              <p className="mt-1 text-lg font-semibold capitalize">
                {certificate.membership?.paymentStatus || "N/A"}
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 p-6 text-center">
            <p className="text-sm text-slate-500">
              This certificate was verified through the
              official E-Membership system.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}