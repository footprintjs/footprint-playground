/**
 * Quick Start — Loan Application
 *
 * A complete loan underwriting pipeline with TypedScope:
 * - Typed property access (no casts needed)
 * - Reading input via $getArgs() (readonly, frozen)
 * - Auto-generated narrative trace (recorder(narrative()) + getNarrative)
 * - Decider-based branching
 *
 * In the playground, edit the INPUT panel (bottom-left) to change applicant data.
 * Try it: https://footprintjs.github.io/footprint-playground/samples/loan-application
 */

import {
  flowChart,
  
  FlowChartExecutor,
  decide,
} from 'footprint';

(async () => {

// ── Types ───────────────────────────────────────────────────────────────

interface LoanApplication {
  applicantName: string;
  annualIncome: number;
  monthlyDebts: number;
  creditScore: number;
  employmentStatus: 'employed' | 'self-employed' | 'unemployed';
  employmentYears: number;
  loanAmount: number;
}

interface LoanInput { app: LoanApplication }

// State produced by the pipeline stages
interface LoanState {
  creditTier: string;
  creditFlags: string[];
  dtiRatio: number;
  dtiPercent: number;
  dtiStatus: string;
  dtiFlags: string[];
  employmentVerified: boolean;
  employmentFlags: string[];
  riskTier: string;
  riskFactors: string[];
  decision: string;
}

const input: LoanInput = (typeof INPUT !== 'undefined' && INPUT) || {
  app: {
    applicantName: 'Bob Martinez',
    annualIncome: 42_000,
    monthlyDebts: 2_100,
    creditScore: 580,
    employmentStatus: 'self-employed',
    employmentYears: 1,
    loanAmount: 40_000,
  },
};

// ── Mock Services ───────────────────────────────────────────────────────

const creditBureau = {
  pullReport: (score: number) => {
    const tier = score >= 740 ? 'excellent' : score >= 670 ? 'good' : score >= 580 ? 'fair' : 'poor';
    return { tier, flags: tier === 'fair' ? ['below-average credit'] : [] };
  },
};

const employerVerification = {
  verify: (status: string, years: number) => ({
    verified: status !== 'unemployed',
    flags: status === 'self-employed' && years < 2 ? [`Self-employed for only ${years} year(s)`] : [],
  }),
};

// ── Flowchart ───────────────────────────────────────────────────────────

const chart = flowChart<LoanState>('ReceiveApplication', async (scope) => {
  const { app } = scope.$getArgs<LoanInput>();
  console.log(`  Received application from ${app.applicantName}`);
}, 'receive-application', undefined, 'Ingest the loan application')

  .addFunction('PullCreditReport', async (scope) => {
    const { app } = scope.$getArgs<LoanInput>();
    await new Promise((r) => setTimeout(r, 40));
    const report = creditBureau.pullReport(app.creditScore);
    scope.creditTier = report.tier;
    scope.creditFlags = report.flags;
  }, 'pull-credit-report', 'Retrieve credit score and flag issues')
  .addFunction('CalculateDTI', async (scope) => {
    const { app } = scope.$getArgs<LoanInput>();
    scope.dtiRatio = Math.round((app.monthlyDebts / (app.annualIncome / 12)) * 100) / 100;
    scope.dtiPercent = Math.round(scope.dtiRatio * 100);
    scope.dtiStatus = scope.dtiRatio > 0.43 ? 'excessive' : 'healthy';
    scope.dtiFlags = scope.dtiRatio > 0.43
      ? [`DTI at ${scope.dtiPercent}% exceeds 43%`] : [];
  }, 'calculate-dti', 'Compute debt-to-income ratio')
  .addFunction('VerifyEmployment', async (scope) => {
    const { app } = scope.$getArgs<LoanInput>();
    await new Promise((r) => setTimeout(r, 25));
    const result = employerVerification.verify(app.employmentStatus, app.employmentYears);
    scope.employmentVerified = result.verified;
    scope.employmentFlags = result.flags;
  }, 'verify-employment', 'Confirm employment status')
  .addFunction('AssessRisk', async (scope) => {
    scope.riskTier = !scope.employmentVerified || scope.dtiStatus === 'excessive' || scope.creditTier === 'poor'
      ? 'high' : 'low';
    scope.riskFactors = [...scope.creditFlags, ...scope.dtiFlags, ...scope.employmentFlags];
  }, 'assess-risk', 'Evaluate risk tier from all flags')
  .addDeciderFunction('LoanDecision', (scope) => {
    return decide(scope, [
      {
        when: { riskTier: { eq: 'low' } },
        then: 'approved',
        label: 'Low risk — no flags',
      },
      {
        when: { riskTier: { eq: 'high' } },
        then: 'rejected',
        label: 'High risk — multiple flags',
      },
    ], 'manual-review');
  }, 'loan-decision', 'Route based on risk tier')
    .addFunctionBranch('approved', 'ApproveApplication', async (scope) => {
      const { app } = scope.$getArgs<LoanInput>();
      scope.decision = `${app.applicantName}: APPROVED`;
    }, 'Generate approval')
    .addFunctionBranch('rejected', 'RejectApplication', async (scope) => {
      const { app } = scope.$getArgs<LoanInput>();
      scope.decision = `${app.applicantName}: REJECTED -- ${scope.riskFactors.join('; ')}`;
    }, 'Generate rejection')
    .addFunctionBranch('manual-review', 'ManualReview', async (scope) => {
      const { app } = scope.$getArgs<LoanInput>();
      scope.decision = `${app.applicantName}: SENT TO MANUAL REVIEW`;
    }, 'Flag for human review')
    .setDefault('manual-review')
    .end()
  .build();

// ── Run ─────────────────────────────────────────────────────────────────

const executor = new FlowChartExecutor(chart);
await executor.run({ input });

console.log('=== Loan Application — Causal Trace ===\n');
executor.getNarrative().forEach((line) => console.log(`  ${line}`));
console.log();
})().catch(console.error);
