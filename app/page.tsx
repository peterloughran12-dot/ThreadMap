import Link from 'next/link';

const THREAD_NODES = [
  { emoji: '💰', label: 'Finance' },
  { emoji: '⚙️', label: 'Operations' },
  { emoji: '🦺', label: 'EHS' },
  { emoji: '📋', label: 'Procurement' },
  { emoji: '👥', label: 'HR' },
];

const FEATURES = [
  {
    title: 'Roadmap view',
    body: 'Every account becomes a visual map of functions instead of a single blind cold call.',
  },
  {
    title: 'Contact tracking',
    body: 'Pull contacts from ZoomInfo or Lusha into each function and track where every conversation stands.',
  },
  {
    title: 'Intel capture',
    body: 'Log what you learn after every call. Budget owners, timelines, politics \u2014 all in one place per function.',
  },
  {
    title: 'AI briefing',
    body: 'Once enough functions are mapped, get a sharp, specific briefing before you approach the decision maker.',
  },
];

const PLANS = [
  { name: 'Free', price: '$0', tagline: 'Try it on a real account', features: ['1 user', '3 accounts', 'No AI briefings'] },
  { name: 'Pro', price: '$49', tagline: 'For a working rep', features: ['1 user', 'Unlimited accounts', 'Unlimited AI briefings'], highlight: true },
  { name: 'Team', price: '$149', tagline: 'For a full pod', features: ['Up to 5 users', 'Unlimited accounts', 'Unlimited AI briefings'] },
];

export default function MarketingPage() {
  return (
    <div className="bg-white text-[#12151A] font-body">
      {/* Nav */}
      <header className="border-b border-[#E6E8EC]">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <span className="font-display text-lg font-bold tracking-tight">ThreadMap</span>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#5C6470] hover:text-[#12151A] transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-control bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#4F52D6] transition-colors"
            >
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #E6E8EC 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <p className="font-mono text-xs uppercase tracking-widest text-[#6366F1] mb-4">
            B2B account mapping
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl leading-[1.1]">
            Map the org before you call the DM.
          </h1>
          <p className="text-lg text-[#5C6470] mt-5 max-w-xl leading-relaxed">
            Most reps cold-call the decision maker blind. ThreadMap has you talk to Finance, Ops, and
            IT first \u2014 then hands you a briefing built from what you actually learned.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center rounded-control bg-[#6366F1] px-5 py-3 text-sm font-medium text-white hover:bg-[#4F52D6] transition-colors"
            >
              Get started free →
            </Link>
            <span className="text-sm text-[#8C94A3]">Free for up to 3 accounts</span>
          </div>

          {/* Signature element: the thread diagram */}
          <div className="mt-16 overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max px-1 py-4">
              {THREAD_NODES.map((node, i) => (
                <div key={node.label} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-card border-2 border-[#10B981]/50 bg-[#10B981]/[0.06] flex items-center justify-center text-2xl">
                      {node.emoji}
                    </div>
                    <span className="mt-2 text-[11px] font-mono text-[#5C6470]">{node.label}</span>
                  </div>
                  {i < THREAD_NODES.length - 1 && <div className="h-px w-8 bg-[#E6E8EC]" />}
                </div>
              ))}
              <div className="h-px w-8 bg-[#E6E8EC]" />
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-card border-2 border-[#F59E0B] bg-[#F59E0B]/[0.08] flex items-center justify-center text-3xl animate-pulse-ring">
                  🎯
                </div>
                <span className="mt-2 text-[11px] font-mono text-[#F59E0B] font-semibold">
                  DM \u2014 unlocked
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-[#E6E8EC] bg-[#FAFAF9]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-[#8C94A3] mb-3">
              The problem
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              One blind call to the top isn&rsquo;t a strategy.
            </h2>
            <p className="text-[#5C6470] leading-relaxed">
              Reps skip straight to the decision maker with no context on budget, politics, or
              timing, then wonder why the deal stalls. Speaking to the functions around the DM
              first gives you the specifics that actually move a deal forward.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[#E6E8EC]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-[#8C94A3] mb-3">
            How it works
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-10">
            Three steps, in order.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Map functions', body: 'Add a target company and ThreadMap lays out the functions you need to cover \u2014 Finance, Ops, IT, and more.' },
              { n: '02', title: 'Build context', body: 'Add contacts per function, log intel after every call, and watch each node turn from empty to complete.' },
              { n: '03', title: 'Approach the DM', body: 'Once you\u2019ve covered enough ground, generate a briefing built from the real intel you gathered.' },
            ].map((step) => (
              <div key={step.n}>
                <span className="font-mono text-xs text-[#6366F1]">{step.n}</span>
                <h3 className="font-display text-lg font-bold mt-2 mb-2">{step.title}</h3>
                <p className="text-sm text-[#5C6470] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[#E6E8EC] bg-[#FAFAF9]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-[#8C94A3] mb-3">
            What you get
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-10">
            Built for the multi-threaded call.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-card border border-[#E6E8EC] bg-white p-6">
                <h3 className="font-display text-base font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-[#5C6470] leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-[#E6E8EC]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-[#8C94A3] mb-3">Pricing</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-10">
            Start free. Upgrade when it&rsquo;s working.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-card border p-6 ${
                  p.highlight ? 'border-[#6366F1] ring-1 ring-[#6366F1]/30' : 'border-[#E6E8EC]'
                }`}
              >
                <h3 className="font-display text-lg font-bold">{p.name}</h3>
                <p className="text-sm text-[#8C94A3] mb-3">{p.tagline}</p>
                <p className="font-mono text-2xl font-bold mb-4">
                  {p.price}
                  <span className="text-sm font-normal text-[#8C94A3]">/mo</span>
                </p>
                <ul className="space-y-1.5 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="text-sm text-[#5C6470]">
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`inline-flex w-full items-center justify-center rounded-control px-4 py-2 text-sm font-medium transition-colors ${
                    p.highlight
                      ? 'bg-[#6366F1] text-white hover:bg-[#4F52D6]'
                      : 'border border-[#E6E8EC] text-[#12151A] hover:bg-[#FAFAF9]'
                  }`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#E6E8EC] bg-[#12151A]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
            Stop cold-calling the DM blind.
          </h2>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-control bg-[#F59E0B] px-5 py-3 text-sm font-medium text-[#1A1200] hover:bg-[#D98708] transition-colors"
          >
            Get started free →
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#E6E8EC]">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-sm text-[#8C94A3]">
          <span>ThreadMap</span>
          <span className="font-mono text-xs">Map the org before you call the DM.</span>
        </div>
      </footer>
    </div>
  );
}
