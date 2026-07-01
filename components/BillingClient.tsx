'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface Plan {
  id: string;
  name: string;
  price: string;
  features: string[];
}

export default function BillingClient({
  currentPlan,
  hasStripeCustomer,
  plans,
}: {
  currentPlan: string;
  hasStripeCustomer: boolean;
  plans: Plan[];
}) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleUpgrade(planId: string) {
    setLoadingPlan(planId);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoadingPlan(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {plans.map((p) => (
          <div
            key={p.id}
            className={clsx(
              'card p-4',
              currentPlan === p.id && 'border-indigo ring-1 ring-indigo/40'
            )}
          >
            <h3 className="font-display font-bold">{p.name}</h3>
            <p className="text-lg font-mono mt-1 mb-3">{p.price}</p>
            <ul className="space-y-1 mb-4">
              {p.features.map((f) => (
                <li key={f} className="text-xs text-text-muted">
                  {f}
                </li>
              ))}
            </ul>
            {currentPlan === p.id ? (
              <span className="pill bg-indigo/15 text-indigo">Current plan</span>
            ) : p.id === 'free' ? null : (
              <button
                onClick={() => handleUpgrade(p.id)}
                disabled={loadingPlan === p.id}
                className="btn-primary w-full !text-xs"
              >
                {loadingPlan === p.id ? 'Redirecting…' : `Upgrade to ${p.name}`}
              </button>
            )}
          </div>
        ))}
      </div>

      {hasStripeCustomer && (
        <a href="/api/stripe/portal" className="btn-ghost inline-flex">
          Manage subscription & invoices
        </a>
      )}
    </div>
  );
}
