/**
 * Flowchart: Decider (Conditional Branching)
 *
 * A decider function inspects scope and returns a branch key.
 * Only the matching branch executes.
 *
 *                   ┌─ "premium"  → ApplyLoyaltyDiscount
 *   LoadCustomer →  ClassifyTier ─┤─ "standard" → SuggestUpgrade
 *                   └─ "trial"    → ShowOnboarding    (default)
 *                                           ↓
 *                                      CalculateTotal
 * Try it: https://footprintjs.github.io/footprint-playground/samples/decider
 */

import { FlowChartBuilder, FlowChartExecutor, ScopeFacade } from 'footprint';

(async () => {

// ── Mock Database ───────────────────────────────────────────────────────

const customerDB = new Map([
  ['C-42', { name: 'Charlie', plan: 'premium', totalSpend: 4_200, since: '2022-03-01' }],
  ['C-77', { name: 'Dana', plan: 'standard', totalSpend: 320, since: '2024-11-15' }],
  ['C-99', { name: 'Eve', plan: 'trial', totalSpend: 0, since: '2025-02-28' }],
]);

// ── Stage Functions ─────────────────────────────────────────────────────

const loadCustomer = async (scope: ScopeFacade) => {
  const customer = customerDB.get('C-42')!;
  scope.setValue('customer', customer);
  scope.setValue('cartAmount', 150);
};

const classifyTier = (scope: ScopeFacade): string => {
  const customer = scope.getValue('customer') as any;
  const plan = customer.plan;
  const spend = customer.totalSpend;
  scope.setValue('evaluatedPlan', plan);
  scope.setValue('evaluatedSpend', spend);

  if (plan === 'premium' && spend > 1000) {
    scope.addDebugInfo('deciderRationale', `plan is "${plan}" and totalSpend ($${spend}) > $1000`);
    return 'premium';
  }
  if (plan === 'standard') {
    scope.addDebugInfo('deciderRationale', `plan is "${plan}"`);
    return 'standard';
  }
  scope.addDebugInfo('deciderRationale', `plan is "${plan}" (not premium or standard), defaulting to trial`);
  return 'trial';
};

const applyLoyaltyDiscount = async (scope: ScopeFacade) => {
  const customer = scope.getValue('customer') as any;
  const years = new Date().getFullYear() - new Date(customer.since).getFullYear();
  const discountPct = Math.min(years * 5, 25); // 5% per year, max 25%
  scope.setValue('discountPct', discountPct);
  scope.setValue(
    'message',
    `Thank you for ${years} years with us! ${discountPct}% loyalty discount applied.`,
  );
};

const suggestUpgrade = async (scope: ScopeFacade) => {
  scope.setValue('discountPct', 5);
  scope.setValue('message', 'Upgrade to Premium for up to 25% off every order.');
};

const showOnboarding = async (scope: ScopeFacade) => {
  scope.setValue('discountPct', 10);
  scope.setValue('message', 'Welcome! Enjoy 10% off your first order.');
};

const calculateTotal = async (scope: ScopeFacade) => {
  const cartAmount = scope.getValue('cartAmount') as number;
  const discountPct = scope.getValue('discountPct') as number;
  const finalAmount = Math.round(cartAmount * (1 - discountPct / 100) * 100) / 100;
  scope.setValue('finalAmount', finalAmount);
  console.log(`  Total: $${cartAmount} → $${finalAmount} (${discountPct}% off)`);
};

// ── Flowchart ───────────────────────────────────────────────────────────

const chart = new FlowChartBuilder()
  .setEnableNarrative()
  .start('LoadCustomer', loadCustomer, 'load-customer', 'Load customer profile from database')
  .addDeciderFunction('ClassifyTier', classifyTier as any, 'classify-tier',
    'Classify customer into premium, standard, or trial tier')
    .addFunctionBranch('premium', 'ApplyLoyaltyDiscount', applyLoyaltyDiscount,
      'Apply loyalty discount based on membership duration')
    .addFunctionBranch('standard', 'SuggestUpgrade', suggestUpgrade,
      'Offer 5% discount and suggest premium upgrade')
    .addFunctionBranch('trial', 'ShowOnboarding', showOnboarding,
      'Show welcome onboarding with 10% first-order discount')
    .setDefault('trial')
    .end()
  .addFunction('CalculateTotal', calculateTotal, 'calculate-total',
    'Calculate final amount after applying discount')
  .build();

// ── Run ─────────────────────────────────────────────────────────────────

const executor = new FlowChartExecutor(chart);
await executor.run();

console.log('=== Decider (Conditional Branching) ===\n');
executor.getNarrative().forEach((line) => console.log(`  ${line}`));
})().catch(console.error);
