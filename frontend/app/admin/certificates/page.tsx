"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  AdminMembership,
  Certificate,
  getAllCertificates,
  getAdminMemberships,
  getCurrentUser,
  issueCertificate,
  logoutUser,
  revokeCertificate,
} from "@/lib/api";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

export default function AdminCertificatesPage() {
  const router = useRouter();

  const [certificates, setCertificates] = useState<
    Certificate[]
  >([]);

  const [memberships, setMemberships] = useState<
    AdminMembership[]
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
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkAdminAccess() {
      try {
        const currentUser = await getCurrentUser();

        if (cancelled) return;

        if (currentUser.user.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        setAuthorized(true);
      } catch {
        if (cancelled) return;

        router.replace("/login");
      }
    }

    checkAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    async function fetchMemberships() {
      try {
        const response = await getAdminMemberships({
          page: 1,
          limit: 100,
          status: "active",
          paymentStatus: "paid",
        });

        if (cancelled) return;

        setMemberships(response.memberships);
      } catch (loadError) {
        if (cancelled) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load memberships"
        );
      }
    }

    fetchMemberships();

    return () => {
      cancelled = true;
    };
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    async function fetchCertificates() {
      try {
        setLoading(true);

        const response = await getAllCertificates({
          page,
          limit: 20,
          search,
          status,
        });

        if (cancelled) return;

        setCertificates(response.certificates);

        setPages(
          Math.max(
            1,
            response.pagination.pages
          )
        );

        setError("");
      } catch (loadError) {
        if (cancelled) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load certificates"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCertificates();

    return () => {
      cancelled = true;
    };
  }, [authorized, page, search, status]);

  function submitSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  }

  const eligibleMemberships =
    memberships.filter(
      (membership) =>
        membership.status === "active" &&
        membership.paymentStatus === "paid" &&
        !membership.certificateIssued
    );

  const activeCertificates = certificates.filter(
    (certificate) =>
      certificate.status === "active"
  ).length;

  const expiredCertificates = certificates.filter(
    (certificate) =>
      certificate.status === "expired"
  ).length;

  const revokedCertificates = certificates.filter(
    (certificate) =>
      certificate.status === "revoked"
  ).length;

  async function handleIssue(
    membershipId: string
  ) {
    setError("");
    setSuccess("");
    setActionId(membershipId);

    try {
      const response = await issueCertificate(
        membershipId
      );

      setCertificates((current) => [
        response.certificate,
        ...current,
      ]);

      setMemberships((current) =>
        current.map((membership) =>
          membership._id === membershipId
            ? {
                ...membership,
                certificateIssued: true,
              }
            : membership
        )
      );

      setSuccess(response.message);
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

  async function handleRevoke(
    certificateId: string
  ) {
    setError("");
    setSuccess("");
    setActionId(certificateId);

    try {
      const response =
        await revokeCertificate(
          certificateId
        );

      setCertificates((current) =>
        current.map((certificate) =>
          certificate.certificateId ===
          certificateId
            ? response.certificate
            : certificate
        )
      );

      setSuccess(response.message);
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "Unable to revoke certificate"
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

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

  function getCertificateStatusClasses(
    certificateStatus: Certificate["status"]
  ) {
    switch (certificateStatus) {
      case "active":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

      case "expired":
        return "border-orange-400/20 bg-orange-400/10 text-orange-300";

      case "revoked":
        return "border-rose-400/20 bg-rose-400/10 text-rose-300";

      default:
        return "border-white/[0.10] bg-[#1b2421] text-[#94a3a0]";
    }
  }

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
              onClick={() =>
                router.push("/admin")
              }
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
            onClick={() =>
              router.push("/admin")
            }
            className="mb-4 text-sm text-[#657773] transition hover:text-[#5eead4]"
          >
            ← Back to Dashboard
          </button>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 px-3 py-1.5 text-xs font-medium text-[#5eead4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
            Certificate Management
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Certificates
          </h2>

          <p className="mt-2 max-w-2xl text-[#94a3a0]">
            Issue, verify, download, and manage
            membership certificates.
          </p>
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

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#141a18] p-5">
            <p className="text-sm text-[#94a3a0]">
              Certificates
            </p>

            <p className="mt-4 text-3xl font-bold">
              {certificates.length}
            </p>

            <p className="mt-2 text-xs text-[#657773]">
              On current page
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-[#141a18] p-5">
            <p className="text-sm text-[#94a3a0]">
              Active
            </p>

            <p className="mt-4 text-3xl font-bold text-emerald-300">
              {activeCertificates}
            </p>

            <p className="mt-2 text-xs text-[#657773]">
              Valid certificates
            </p>
          </div>

          <div className="rounded-2xl border border-orange-400/20 bg-[#141a18] p-5">
            <p className="text-sm text-[#94a3a0]">
              Expired
            </p>

            <p className="mt-4 text-3xl font-bold text-orange-300">
              {expiredCertificates}
            </p>

            <p className="mt-2 text-xs text-[#657773]">
              No longer valid
            </p>
          </div>

          <div className="rounded-2xl border border-rose-400/20 bg-[#141a18] p-5">
            <p className="text-sm text-[#94a3a0]">
              Revoked
            </p>

            <p className="mt-4 text-3xl font-bold text-rose-300">
              {revokedCertificates}
            </p>

            <p className="mt-2 text-xs text-[#657773]">
              Manually revoked
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
                htmlFor="certificate-search"
                className="sr-only"
              >
                Search certificate
              </label>

              <input
                id="certificate-search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
                placeholder="Search certificate ID or member..."
                className="w-full rounded-xl border border-white/[0.10] bg-[#0b0f0e] px-4 py-3 text-sm text-[#f1f5f4] outline-none transition placeholder:text-[#657773] focus:border-[#5eead4]/50 focus:ring-2 focus:ring-[#5eead4]/10"
              />
            </div>

            <div className="lg:w-48">
              <label
                htmlFor="certificate-status"
                className="sr-only"
              >
                Filter certificate status
              </label>

              <select
                id="certificate-status"
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

                <option value="active">
                  Active
                </option>

                <option value="expired">
                  Expired
                </option>

                <option value="revoked">
                  Revoked
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

        {/* Eligible Memberships */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141a18]">
          <div className="border-b border-white/[0.08] px-5 py-5 sm:px-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 text-lg text-[#5eead4]">
                ✓
              </div>

              <div>
                <h3 className="font-semibold">
                  Eligible Memberships
                </h3>

                <p className="mt-1 text-sm text-[#657773]">
                  Paid and active memberships waiting
                  for certificate issuance.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {loading ? (
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0b0f0e] px-4 py-4 text-sm text-[#94a3a0]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#5eead4]" />
                Loading memberships...
              </div>
            ) : eligibleMemberships.length ? (
              <div className="space-y-3">
                {eligibleMemberships.map(
                  (membership) => {
                    const memberName =
                      typeof membership.user ===
                      "object"
                        ? membership.user.name
                        : "Unknown member";

                    const memberEmail =
                      typeof membership.user ===
                      "object"
                        ? membership.user.email
                        : "";

                    const planName =
                      typeof membership.plan ===
                      "object"
                        ? membership.plan.name
                        : "Membership";

                    const initial =
                      memberName
                        .charAt(0)
                        .toUpperCase() || "U";

                    const isIssuing =
                      actionId === membership._id;

                    return (
                      <div
                        key={membership._id}
                        className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#0b0f0e] p-4 transition hover:border-[#5eead4]/20 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#5eead4]/20 bg-[#5eead4]/10 text-sm font-semibold text-[#5eead4]">
                            {initial}
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium">
                              {memberName}
                            </p>

                            <p className="mt-1 text-xs text-[#657773]">
                              {memberEmail}
                            </p>

                            <div className="mt-2 inline-flex rounded-full border border-[#5eead4]/10 bg-[#5eead4]/5 px-2.5 py-1 text-xs text-[#5eead4]">
                              {planName}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isIssuing}
                          onClick={() =>
                            handleIssue(
                              membership._id
                            )
                          }
                          className="rounded-xl bg-[#5eead4] px-5 py-2.5 text-sm font-semibold text-[#0b0f0e] transition hover:bg-[#2dd4bf] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isIssuing
                            ? "Issuing..."
                            : "Issue Certificate"}
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f0e] px-6 py-10 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#1b2421] text-[#657773]">
                  ✓
                </div>

                <p className="font-medium">
                  No eligible memberships
                </p>

                <p className="mt-2 text-sm text-[#657773]">
                  All paid active memberships already
                  have certificates.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Issued Certificates */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141a18]">
          <div className="flex flex-col gap-1 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h3 className="font-semibold">
                Issued Certificates
              </h3>

              <p className="mt-1 text-sm text-[#657773]">
                Manage existing membership certificates.
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
                Loading certificates...
              </div>
            </div>
          ) : certificates.length ? (
            <div className="space-y-3 p-4 sm:p-5">
              {certificates.map((certificate) => {
                const memberName =
                  typeof certificate.user ===
                  "object"
                    ? certificate.user.name
                    : "Member";

                const initial =
                  memberName
                    .charAt(0)
                    .toUpperCase() || "M";

                const isRevoking =
                  actionId ===
                  certificate.certificateId;

                const pdfUrl = `${API_URL}/certificates/${encodeURIComponent(
                  certificate.certificateId
                )}/pdf`;

                return (
                  <article
                    key={certificate._id}
                    className="rounded-2xl border border-white/[0.08] bg-[#0b0f0e] p-5 transition hover:border-[#5eead4]/15"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/10 font-semibold text-[#5eead4]">
                          {initial}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold">
                              {memberName}
                            </h4>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getCertificateStatusClasses(
                                certificate.status
                              )}`}
                            >
                              {certificate.status}
                            </span>
                          </div>

                          <p className="mt-2 break-all font-mono text-sm text-[#5eead4]">
                            {certificate.certificateId}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#657773]">
                            <span>
                              Issued:{" "}
                              {formatDate(
                                certificate.issueDate
                              )}
                            </span>

                            <span>
                              Expires:{" "}
                              {formatDate(
                                certificate.expiryDate
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <a
                          href={pdfUrl}
                          className="rounded-xl border border-[#5eead4]/20 bg-[#5eead4]/5 px-4 py-2.5 text-sm font-medium text-[#5eead4] transition hover:bg-[#5eead4]/10"
                        >
                          Download PDF
                        </a>

                        {certificate.status ===
                          "active" && (
                          <button
                            type="button"
                            disabled={isRevoking}
                            onClick={() =>
                              handleRevoke(
                                certificate.certificateId
                              )
                            }
                            className="rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isRevoking
                              ? "Revoking..."
                              : "Revoke"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#5eead4]/20 bg-[#5eead4]/10 text-xl font-bold text-[#5eead4]">
                C
              </div>

              <h4 className="font-semibold">
                No certificates found
              </h4>

              <p className="mt-2 text-sm text-[#657773]">
                Certificates will appear here after
                they are issued.
              </p>
            </div>
          )}

          {/* Pagination */}
          {!loading && certificates.length > 0 && (
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