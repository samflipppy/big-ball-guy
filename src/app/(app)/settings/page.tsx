'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PricingTable } from '@/components/billing/PricingTable';
import { createPortalSession, type PlanId } from '@/lib/stripe';
import { cn } from '@/lib/utils';

type SettingsSection = 'team' | 'billing' | 'account';

const SECTION_NAV: { id: SettingsSection; label: string }[] = [
  { id: 'team', label: 'Team' },
  { id: 'billing', label: 'Billing' },
  { id: 'account', label: 'Account' },
];

const LEVEL_OPTIONS = [
  { value: 'youth', label: 'Youth' },
  { value: 'high_school', label: 'High School' },
  { value: 'college', label: 'College' },
  { value: 'pro', label: 'Pro' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('team');
  const [teamName, setTeamName] = useState('My Team');
  const [teamLevel, setTeamLevel] = useState('high_school');
  const [primaryColor, setPrimaryColor] = useState('#1d4ed8');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [currentPlan] = useState<PlanId>('free');
  const [email] = useState('coach@example.com');
  const [saving, setSaving] = useState(false);

  const inputClasses =
    'block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500';

  const labelClasses = 'mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300';

  async function handleSaveTeam() {
    setSaving(true);
    // In production this would persist the team to the backend
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
  }

  function handleManageBilling() {
    createPortalSession('team-id');
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8" data-testid="settings-page">
      <h1 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>

      {/* Section navigation */}
      <div className="mb-8 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800" data-testid="section-nav">
        {SECTION_NAV.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeSection === section.id
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200',
            )}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Team section */}
      {activeSection === 'team' && (
        <section data-testid="team-section">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Team Settings
          </h2>
          <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <div>
              <label htmlFor="settings-team-name" className={labelClasses}>
                Team Name
              </label>
              <input
                id="settings-team-name"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="settings-team-level" className={labelClasses}>
                Level
              </label>
              <select
                id="settings-team-level"
                value={teamLevel}
                onChange={(e) => setTeamLevel(e.target.value)}
                className={inputClasses}
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="settings-primary-color" className={labelClasses}>
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="settings-primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700"
                  />
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{primaryColor}</span>
                </div>
              </div>
              <div>
                <label htmlFor="settings-secondary-color" className={labelClasses}>
                  Secondary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="settings-secondary-color"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700"
                  />
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {secondaryColor}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={handleSaveTeam} loading={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Billing section */}
      {activeSection === 'billing' && (
        <section data-testid="billing-section">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Billing & Plans
            </h2>
            <Button variant="secondary" size="sm" onClick={handleManageBilling}>
              Manage Billing
            </Button>
          </div>

          <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Current plan</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {currentPlan === 'free' ? 'Free' : currentPlan === 'pro' ? 'Pro' : 'Team'}
            </p>
          </div>

          <PricingTable currentPlan={currentPlan} teamId="team-id" />
        </section>
      )}

      {/* Account section */}
      {activeSection === 'account' && (
        <section data-testid="account-section">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Account
          </h2>
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Email Address
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{email}</p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Password
              </h3>
              <Button variant="secondary" size="sm">
                Change Password
              </Button>
            </div>

            <div className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-800 dark:bg-zinc-900">
              <h3 className="mb-2 text-sm font-semibold text-red-600 dark:text-red-400">
                Danger Zone
              </h3>
              <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                Sign out of your account on this device.
              </p>
              <Button variant="danger" size="sm">
                Log Out
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
