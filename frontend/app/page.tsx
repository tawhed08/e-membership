import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Simple membership",
    description:
      "Explore clear plans, understand what you get, and keep your membership journey organized from one place.",
  },
  {
    number: "02",
    title: "Payment clarity",
    description:
      "Submit bKash, Nagad, bank, or supported card payments and keep track of every important payment step.",
  },
  {
    number: "03",
    title: "Digital credentials",
    description:
      "Access your membership certificate digitally and let others verify its authenticity through a dedicated verification page.",
  },
];

const stats = [
  ["01", "Membership plans", "Clear options for every member"],
  ["02", "Secure payments", "Transparent payment tracking"],
  ["03", "Digital certificates", "Easy verification anywhere"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0f0e] text-[#f1f5f4]">
      {/* Hero */}
      <section className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute left-1/2 top-[-260px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-teal-300/7 blur-3xl" />
          <div className="absolute right-[-180px] top-32 h-[420px] w-[420px] rounded-full bg-cyan-300/5 blur-3xl" />
          <div className="absolute bottom-[-180px] left-[-160px] h-[400px] w-[400px] rounded-full bg-emerald-300/5 blur-3xl" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-16 px-6 pb-20 pt-14 lg:grid-cols-[1.04fr_0.96fr] lg:gap-12 lg:pt-20">
          {/* Hero copy */}
          <div className="animate-float-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/15 bg-teal-300/6 px-3.5 py-2 text-xs font-semibold text-teal-300 shadow-[0_0_30px_rgba(94,234,212,0.04)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
              Membership, without the busywork
            </div>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.3em] text-teal-300">
              One place to belong
            </p>

            <h1 className="mt-5 max-w-4xl text-5xl font-bold leading-[1.04] tracking-[-0.035em] sm:text-6xl xl:text-7xl">
              Your membership,
              <span className="block bg-gradient-to-r from-teal-200 via-cyan-200 to-emerald-300 bg-clip-text pb-2 text-transparent">
                beautifully in sync.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-[#94a3a0] sm:text-lg">
              A calmer way to manage membership plans, payments, certificates,
              and important dates. Everything members need, organized in one
              clear experience.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/membership"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-teal-300 px-6 py-3.5 font-semibold text-[#07110f] shadow-xl shadow-teal-300/10 transition hover:-translate-y-0.5 hover:bg-teal-200"
              >
                Explore membership plans
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 font-semibold text-[#f1f5f4] transition hover:-translate-y-0.5 hover:border-teal-300/30 hover:bg-teal-300/5"
              >
                Get started for free
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#657773]">
              <span className="inline-flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300/10 text-xs text-emerald-300">
                  ✓
                </span>
                Secure account access
              </span>

              <span className="inline-flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-300/10 text-xs text-teal-300">
                  ✓
                </span>
                Verified digital credentials
              </span>
            </div>
          </div>

          {/* Product preview */}
          <div className="relative mx-auto w-full max-w-xl animate-float-in">
            <div
              aria-hidden="true"
              className="absolute -inset-10 rounded-full bg-teal-300/6 blur-3xl"
            />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#141a18]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-5">
              {/* Window header */}
              <div className="flex items-center justify-between border-b border-white/8 px-2 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-300/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" />
                </div>

                <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] text-[#657773]">
                  E-MEMBERSHIP
                </div>
              </div>

              {/* Dashboard preview */}
              <div className="p-3 pt-5 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#657773]">
                      Member overview
                    </p>
                    <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                      Everything, together.
                    </h2>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/8 px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    Active
                  </span>
                </div>

                {/* Progress */}
                <div className="mt-7 rounded-2xl border border-white/8 bg-[#0b0f0e]/65 p-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-[#657773]">
                        Membership progress
                      </p>
                      <p className="mt-2 text-sm font-semibold">
                        Your membership is on track
                      </p>
                    </div>

                    <span className="text-xs font-semibold text-teal-300">
                      67%
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-teal-300 to-emerald-300" />
                  </div>

                  <div className="mt-3 flex justify-between text-[10px] text-[#657773]">
                    <span>Payment reviewed</span>
                    <span>Certificate ready</span>
                  </div>
                </div>

                {/* Mini cards */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/8 bg-[#0b0f0e]/65 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-300/8 text-teal-300">
                      $
                    </div>

                    <p className="mt-4 text-xs text-[#657773]">
                      Payments
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      Clear & tracked
                    </p>

                    <p className="mt-1 text-[10px] text-emerald-300">
                      Every step visible
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-[#0b0f0e]/65 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300/8 text-emerald-300">
                      ✓
                    </div>

                    <p className="mt-4 text-xs text-[#657773]">
                      Credentials
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      Digital & verifiable
                    </p>

                    <p className="mt-1 text-[10px] text-teal-300">
                      QR-ready certificates
                    </p>
                  </div>
                </div>

                {/* Reminder */}
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-amber-300/10 bg-amber-300/5 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">
                    !
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#f1f5f4]">
                      Stay ahead
                    </p>
                    <p className="mt-0.5 text-[10px] leading-5 text-[#657773]">
                      Helpful reminders keep important membership dates visible.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating verification badge */}
            <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-white/10 bg-[#141a18]/95 p-3 shadow-2xl backdrop-blur-xl sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300">
                  ✓
                </div>

                <div>
                  <p className="text-[10px] text-[#657773]">
                    Credential status
                  </p>
                  <p className="text-xs font-semibold text-emerald-300">
                    Verified
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-white/8 bg-white/[0.015]">
        <div className="mx-auto grid max-w-7xl gap-px px-6 sm:grid-cols-3">
          {stats.map(([number, title, description]) => (
            <div
              key={number}
              className="border-white/8 px-2 py-7 sm:border-r sm:px-8 sm:py-8 last:border-r-0"
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold tracking-widest text-teal-300">
                  {number}
                </span>

                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs text-[#657773]">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About / Features */}
      <section
        id="about"
        className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24 sm:py-28"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-teal-300">
            One connected experience
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            The details are handled.
            <span className="block text-[#94a3a0]">
              You focus on belonging.
            </span>
          </h2>

          <p className="mt-5 max-w-xl text-sm leading-7 text-[#657773]">
            E-Membership brings the important parts of your membership journey
            into one focused, easy-to-understand experience.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="group rounded-3xl border border-white/8 bg-white/[0.025] p-7 transition duration-300 hover:-translate-y-1 hover:border-teal-300/20 hover:bg-teal-300/[0.025]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-teal-300">
                  {feature.number}
                </span>

                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-[#657773] transition group-hover:border-teal-300/15 group-hover:text-teal-300">
                  →
                </span>
              </div>

              <h3 className="mt-8 text-xl font-semibold">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#657773]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Verification CTA */}
      <section className="px-6 pb-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-teal-300/10 bg-teal-300/[0.035] p-8 sm:p-10 lg:p-12">
          <div
            aria-hidden="true"
            className="absolute right-[-100px] top-[-160px] h-80 w-80 rounded-full bg-teal-300/7 blur-3xl"
          />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-300">
                Built for trust
              </p>

              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Need to verify a membership certificate?
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#657773]">
                Use the public verification system to check a certificate ID
                and confirm its current status.
              </p>
            </div>

            <Link
              href="/verify"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-teal-300/20 bg-teal-300/8 px-6 py-3.5 font-semibold text-teal-300 transition hover:-translate-y-0.5 hover:bg-teal-300/12"
            >
              Verify a certificate
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="scroll-mt-24 border-t border-white/8 bg-white/[0.012]"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-teal-300">
              FAQ
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              A few helpful answers.
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#657773]">
              Everything you need to know before getting started.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/8 bg-[#141a18]/60 p-6 transition hover:border-teal-300/15">
              <h3 className="font-semibold">
                When does my membership become active?
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#657773]">
                Membership access begins after a manual payment is approved or
                a card payment is verified by the payment gateway.
              </p>
            </article>

            <article className="rounded-2xl border border-white/8 bg-[#141a18]/60 p-6 transition hover:border-teal-300/15">
              <h3 className="font-semibold">
                How do I verify a certificate?
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#657773]">
                Scan its QR code or open the certificate verification page and
                enter the certificate ID.
              </p>
            </article>

            <article className="rounded-2xl border border-white/8 bg-[#141a18]/60 p-6 transition hover:border-teal-300/15">
              <h3 className="font-semibold">
                Can I pay by card?
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#657773]">
                When enabled by the membership team, card payments use aamarPay
                hosted checkout. Card details are never stored by this
                platform.
              </p>
            </article>

            <article className="rounded-2xl border border-white/8 bg-[#141a18]/60 p-6 transition hover:border-teal-300/15">
              <h3 className="font-semibold">
                Will I get an expiry reminder?
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#657773]">
                The system sends reminders 30, 7, and 1 day before expiry when
                email delivery is configured.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 text-sm text-[#657773] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[#94a3a0]">E-Membership</p>
            <p className="mt-1 text-xs">
              Member experience, thoughtfully managed.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Link
              href="/membership"
              className="transition hover:text-teal-300"
            >
              Plans
            </Link>

            <Link
              href="/verify"
              className="transition hover:text-teal-300"
            >
              Verify
            </Link>

            <Link
              href="/login"
              className="transition hover:text-teal-300"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="transition hover:text-teal-300"
            >
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}