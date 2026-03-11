/**
 * Quick Start — Loan Application
 *
 * A complete loan underwriting pipeline that demonstrates:
 * - Reading input via getArgs() (readonly, frozen, shared across all stages)
 * - Writing computed values via setValue() (stage-produced data)
 * - Auto-generated narrative trace
 * - Decider-based branching
 * - Combined narrative output for LLM consumption
 *
 * Run:  npm run quick-start
 *
 * In the playground, edit the INPUT panel (bottom-left) to change applicant data.
 */

import {
  FlowChartBuilder,
  FlowChartExecutor,
  ScopeFacade,
  NarrativeRecorder,
  CombinedNarrativeBuilder,
} from 'footprint';

(async () => {

// ── Application data ────────────────────────────────────────────────────
// In the playground, INPUT is provided via the JSON input panel.
// When running standalone, define it here as a fallback.

interface LoanApplication {
  applicantName: string;
  annualIncome: number;
  monthlyDebts: number;
  creditScore: number;
  employmentStatus: 'employed' | 'self-employed' | 'unemployed';
  employmentYears: number;
  loanAmount: number;
}

interface LoanInput {
  app: LoanApplication;
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

// ── Stage functions ─────────────────────────────────────────────────────
// Input is always read via getArgs() — frozen, readonly, same across all stages.
// Computed values are written to scope via setValue().

const receiveApplication = async (scope: ScopeFacade) => {
  const { app } = scope.getArgs<LoanInput>();
  console.log(`Received application from ${app.applicantName}`);
};

const pullCreditReport = async (scope: ScopeFacade) => {
  const { app } = scope.getArgs<LoanInput>();
  await new Promise((r) => setTimeout(r, 40)); // simulate credit bureau API call
  const tier =
    app.creditScore >= 740
      ? 'excellent'
      : app.creditScore >= 670
        ? 'good'
        : app.creditScore >= 580
          ? 'fair'
          : 'poor';
  scope.setValue('creditTier', tier);
  scope.setValue('creditFlags', tier === 'fair' ? ['below-average credit'] : []);
};

const calculateDTI = async (scope: ScopeFacade) => {
  const { app } = scope.getArgs<LoanInput>();
  const dtiRatio = Math.round((app.monthlyDebts / (app.annualIncome / 12)) * 100) / 100;
  scope.setValue('dtiRatio', dtiRatio);
  scope.setValue('dtiPercent', Math.round(dtiRatio * 100));
  scope.setValue('dtiStatus', dtiRatio > 0.43 ? 'excessive' : 'healthy');
  scope.setValue(
    'dtiFlags',
    dtiRatio > 0.43 ? [`DTI at ${Math.round(dtiRatio * 100)}% exceeds 43%`] : [],
  );
};

const verifyEmployment = async (scope: ScopeFacade) => {
  const { app } = scope.getArgs<LoanInput>();
  await new Promise((r) => setTimeout(r, 25)); // simulate employer verification
  const verified = app.employmentStatus !== 'unemployed';
  scope.setValue('employmentVerified', verified);
  scope.setValue(
    'employmentFlags',
    app.employmentStatus === 'self-employed' && app.employmentYears < 2
      ? [`Self-employed for only ${app.employmentYears} year(s)`]
      : [],
  );
};

const assessRisk = async (scope: ScopeFacade) => {
  const creditTier = scope.getValue('creditTier') as string;
  const dtiStatus = scope.getValue('dtiStatus') as string;
  const verified = scope.getValue('employmentVerified') as boolean;

  const riskTier =
    !verified || dtiStatus === 'excessive' || creditTier === 'poor' ? 'high' : 'low';
  scope.setValue('riskTier', riskTier);

  const flags = [
    ...(scope.getValue('creditFlags') as string[]),
    ...(scope.getValue('dtiFlags') as string[]),
    ...(scope.getValue('employmentFlags') as string[]),
  ];
  scope.setValue('riskFactors', flags);
};

const loanDecider = (scope: ScopeFacade): string => {
  const tier = scope.getValue('riskTier') as string;
  return tier === 'low' ? 'approved' : tier === 'high' ? 'rejected' : 'manual-review';
};

const approveApplication = async (scope: ScopeFacade) => {
  const { app } = scope.getArgs<LoanInput>();
  scope.setValue('decision', `${app.applicantName}: APPROVED`);
};

const rejectApplication = async (scope: ScopeFacade) => {
  const { app } = scope.getArgs<LoanInput>();
  const factors = scope.getValue('riskFactors') as string[];
  scope.setValue('decision', `${app.applicantName}: REJECTED — ${factors.join('; ')}`);
};

const manualReview = async (scope: ScopeFacade) => {
  const { app } = scope.getArgs<LoanInput>();
  scope.setValue('decision', `${app.applicantName}: SENT TO MANUAL REVIEW`);
};

// ── Build the flow ──────────────────────────────────────────────────────

const chart = new FlowChartBuilder()
  .setEnableNarrative()
  .start('ReceiveApplication', receiveApplication, undefined,
    'Ingest the loan application and store applicant data')
  .addFunction('PullCreditReport', pullCreditReport, undefined,
    'Retrieve credit score and flag any credit issues')
  .addFunction('CalculateDTI', calculateDTI, undefined,
    'Compute debt-to-income ratio and flag excessive debt')
  .addFunction('VerifyEmployment', verifyEmployment, undefined,
    'Confirm employment status and years of experience')
  .addFunction('AssessRisk', assessRisk, undefined,
    'Evaluate all flags and credit data to determine risk tier')
  .addDeciderFunction('LoanDecision', loanDecider as any, undefined,
    'Route to approval, rejection, or manual review based on risk tier')
    .addFunctionBranch('approved', 'ApproveApplication', approveApplication,
      'Generate approval letter with loan terms')
    .addFunctionBranch('rejected', 'RejectApplication', rejectApplication,
      'Generate rejection notice with denial reasons')
    .addFunctionBranch('manual-review', 'ManualReview', manualReview,
      'Flag for human underwriter review with risk summary')
    .setDefault('manual-review')
    .end()
  .build();

// ── Instrument with NarrativeRecorder ───────────────────────────────────

const recorder = new NarrativeRecorder({ id: 'loan', detail: 'full' });

const scopeFactory = (ctx: any, stageName: string, readOnly?: unknown) => {
  const scope = new ScopeFacade(ctx, stageName, readOnly);
  scope.attachRecorder(recorder);
  return scope;
};

// ── Run with runtime input ──────────────────────────────────────────────

const executor = new FlowChartExecutor(chart, scopeFactory);
await executor.run({ input });

// ── Print the causal trace ──────────────────────────────────────────────

const flowNarrative = executor.getFlowNarrative();
const combined = new CombinedNarrativeBuilder();
const narrative = combined.build(flowNarrative, recorder);

console.log('=== Loan Application — Causal Trace ===\n');
narrative.forEach((line) => console.log(`  ${line}`));
console.log();
})().catch(console.error);
