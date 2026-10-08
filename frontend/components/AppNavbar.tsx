"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMyNotifications } from "@/lib/api";
import ThemeControl from "@/components/ThemeControl";

interface NavigationLink {
  href: string;
  label: string;
}

const publicLinks: NavigationLink[] = [
  { href: "/", label: "Home" },
  { href: "/membership", label: "Plans" },
  { href: "/verify", label: "Verify certificate" },
  { href: "/#about", label: "About" },
  { href: "/#faq", label: "FAQ" },
];

const userLinks: NavigationLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/membership", label: "Membership" },
  { href: "/membership/payment", label: "Payments" },
  { href: "/dashboard#certificate", label: "Certificate" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export default function AppNavbar() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const isAdmin = pathname.startsWith("/admin");

  const isMember =
    pathname === "/dashboard" ||
    pathname === "/notifications" ||
    pathname === "/profile" ||
    pathname === "/settings" ||
    pathname === "/membership/payment";

  const links = isMember ? userLinks : publicLinks;

  useEffect(() => {
    if (!isMember) {
      return;
    }

    let cancelled = false;

    getMyNotifications({ page: 1, limit: 1 })
      .then((response) => {
        if (!cancelled) {
          setUnread(response.unread);
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to load notification badge:", error);

        if (!cancelled) {
          setUnread(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isMember, pathname]);

  if (isAdmin) {
    return null;
  }

  function isActive(href: string): boolean {
    if (href.startsWith("/#")) {
      return false;
    }

    if (href.includes("#")) {
      return pathname === href.split("#")[0];
    }

    return href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--surface)]/95 text-[var(--foreground)] shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link
          href={isMember ? "/dashboard" : "/"}
          className="flex shrink-0 items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/10 text-lg font-bold text-[var(--brand)] shadow-lg shadow-[var(--brand)]/5">
            E
          </span>

          <div className="hidden sm:block">
            <span className="block font-bold tracking-tight text-[var(--foreground)]">
              E-Membership
            </span>

            <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
              Membership platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {links.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  active
                    ? "border border-[var(--brand)]/15 bg-[var(--brand)]/10 text-[var(--brand)]"
                    : "border border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:bg-[var(--brand)]/5 hover:text-[var(--foreground)]"
                }`}
              >
                {link.label}

                {link.href === "/notifications" && unread > 0 && (
                  <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--coral)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <ThemeControl />

          {isMember ? (
            <Link
              href="/profile"
              className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-3.5 py-2.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]/30 hover:text-[var(--brand)]"
            >
              Account
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-bold text-[#0b0f0e] transition hover:bg-[var(--cyan)]"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeControl />

          <button
            type="button"
            aria-label={
              open ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] text-lg text-[var(--foreground)] transition hover:border-[var(--brand)]/30 hover:text-[var(--brand)]"
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <nav
          aria-label="Mobile navigation"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-[var(--line)] bg-[var(--surface)] px-4 py-3 lg:hidden"
        >
          <div className="mx-auto grid max-w-2xl gap-1 sm:grid-cols-2">
            {links.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-xl border px-3.5 py-3 text-sm font-medium transition ${
                    active
                      ? "border-[var(--brand)]/15 bg-[var(--brand)]/10 text-[var(--brand)]"
                      : "border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:bg-[var(--brand)]/5 hover:text-[var(--foreground)]"
                  }`}
                >
                  <span>{link.label}</span>

                  {link.href === "/notifications" && unread > 0 && (
                    <span className="rounded-full bg-[var(--coral)] px-2 py-0.5 text-[10px] font-bold text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </Link>
              );
            })}

            {isMember ? (
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-3.5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]/30 hover:text-[var(--brand)]"
              >
                Account
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-[var(--line)] px-3.5 py-3 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--brand)]/5 hover:text-[var(--foreground)]"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-[var(--brand)] px-3.5 py-3 text-sm font-bold text-[#0b0f0e] transition hover:bg-[var(--cyan)]"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}