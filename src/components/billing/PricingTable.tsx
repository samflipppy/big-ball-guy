'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PLANS, formatPrice, createCheckoutSession, type PlanId } from '@/lib/stripe';
import { cn } from '@/lib/utils';

export interface PricingTableProps {
  currentPlan?: PlanId;
  teamId?: string;
  onSelectPlan?: (planId: PlanId) => void;
}

const PLAN_ORDER: PlanId[] = ['free', 'pro', 'team'];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-5 w-5 text-green-500', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-5 w-5 text-zinc-300 dark:text-zinc-600', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/** Feature rows for the comparison table */
const COMPARISON_FEATURES = [
  { label: 'Plays', free: '5', pro: 'Unlimited', team: 'Unlimited' },
  { label: 'Game plans', free: '1', pro: 'Unlimited', team: 'Unlimited' },
  { label: 'PDF & image export', free: false, pro: true, team: true },
  { label: 'Play sharing', free: false, pro: true, team: true },
  { label: 'Coaches', free: '1', pro: '1', team: '10' },
  { label: 'Real-time collaboration', free: false, pro: false, team: true },
  { label: 'Priority support', free: false, pro: false, team: true },
];

export function PricingTable({ currentPlan = 'free', teamId, onSelectPlan }: PricingTableProps) {
  const [annual, setAnnual] = useState(false);

  function handleSelectPlan(planId: PlanId) {
    if (onSelectPlan) {
      onSelectPlan(planId);
    } else if (teamId && planId !== 'free') {
      createCheckoutSession(planId, teamId, annual);
    }
  }

  function getCtaLabel(planId: PlanId): string {
    if (planId === currentPlan) return 'Current Plan';
    if (planId === 'team' && currentPlan === 'team') return 'Contact Sales';
    if (planId === 'free') return 'Downgrade';
    return 'Upgrade';
  }

  function getCtaVariant(planId: PlanId): 'primary' | 'secondary' | 'ghost' {
    if (planId === currentPlan) return 'secondary';
    if (planId === 'pro') return 'primary';
    return 'secondary';
  }

  return (
    <div data-testid="pricing-table">
      {/* Monthly / Annual toggle */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <span
          className={cn(
            'text-sm font-medium',
            !annual ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400',
          )}
        >
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual(!annual)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            annual ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600',
          )}
          data-testid="billing-toggle"
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform',
              annual ? 'translate-x-5' : 'translate-x-0',
            )}
          />
        </button>
        <span
          className={cn(
            'text-sm font-medium',
            annual ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400',
          )}
        >
          Annual
          <span className="ml-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
            2 months free
          </span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = planId === currentPlan;
          const price = annual ? plan.annualPrice : plan.monthlyPrice;

          return (
            <div
              key={planId}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6',
                isCurrent
                  ? 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400 dark:ring-blue-400/20'
                  : 'border-zinc-200 dark:border-zinc-700',
                planId === 'pro' && !isCurrent && 'border-blue-200 dark:border-blue-800',
              )}
              data-testid={`plan-card-${planId}`}
            >
              {/* Popular badge for Pro */}
              {planId === 'pro' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current plan badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                    Current Plan
                  </span>
                </div>
              )}

              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {plan.description}
              </p>

              <div className="mt-4">
                <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatPrice(price)}
                </span>
                {price > 0 && (
                  <span className="ml-1 text-sm text-zinc-500 dark:text-zinc-400">/mo</span>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 shrink-0" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Button
                  variant={getCtaVariant(planId)}
                  fullWidth
                  disabled={isCurrent}
                  onClick={() => handleSelectPlan(planId)}
                  data-testid={`plan-cta-${planId}`}
                >
                  {getCtaLabel(planId)}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div className="mt-12 overflow-x-auto">
        <table className="w-full text-sm" data-testid="comparison-table">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="pb-3 pr-4 text-left font-medium text-zinc-500 dark:text-zinc-400">
                Feature
              </th>
              {PLAN_ORDER.map((planId) => (
                <th
                  key={planId}
                  className="pb-3 text-center font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {PLANS[planId].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_FEATURES.map((row) => (
              <tr
                key={row.label}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">{row.label}</td>
                {(['free', 'pro', 'team'] as const).map((planId) => {
                  const value = row[planId];
                  return (
                    <td key={planId} className="py-3 text-center">
                      {typeof value === 'boolean' ? (
                        value ? (
                          <CheckIcon className="mx-auto" />
                        ) : (
                          <XIcon className="mx-auto" />
                        )
                      ) : (
                        <span className="text-zinc-700 dark:text-zinc-300">{value}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PricingTable;
