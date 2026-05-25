/**
 * Loan application chart — TS-importable factory mirroring the
 * `samples/examples/getting-started/loan-application.ts` sample.
 *
 * The sample file is a string source for the Monaco editor; this
 * factory is the same chart shape callable from React without going
 * through the `executeCode` eval path. Used by `/observe-v2` to
 * exercise the L8 stack against a real footprintjs run.
 */

import { flowChart, decide } from "footprintjs";
import type { StructureRecorder } from "footprintjs";

export interface LoanApplication {
  applicantName: string;
  annualIncome: number;
  monthlyDebts: number;
  creditScore: number;
  employmentStatus: "employed" | "self-employed" | "unemployed";
  employmentYears: number;
  loanAmount: number;
}

export interface LoanInput {
  app: LoanApplication;
}

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

const creditBureau = {
  pullReport: (score: number) => {
    const tier =
      score >= 740
        ? "excellent"
        : score >= 670
          ? "good"
          : score >= 580
            ? "fair"
            : "poor";
    return { tier, flags: tier === "fair" ? ["below-average credit"] : [] };
  },
};

const employerVerification = {
  verify: (status: string, years: number) => ({
    verified: status !== "unemployed",
    flags:
      status === "self-employed" && years < 2
        ? [`Self-employed for only ${years} year(s)`]
        : [],
  }),
};

export const DEFAULT_LOAN_INPUT: LoanInput = {
  app: {
    applicantName: "Bob Martinez",
    annualIncome: 42_000,
    monthlyDebts: 2_100,
    creditScore: 580,
    employmentStatus: "self-employed",
    employmentYears: 1,
    loanAmount: 40_000,
  },
};

export function buildLoanChart(structureRecorder: StructureRecorder) {
  return flowChart<LoanState>(
    "ReceiveApplication",
    async (scope) => {
      const { app } = scope.$getArgs<LoanInput>();
      void app; // exercise getArgs (read-only ingress)
    },
    "receive-application",
    { structureRecorders: [structureRecorder] },
  )
    .addFunction(
      "PullCreditReport",
      async (scope) => {
        const { app } = scope.$getArgs<LoanInput>();
        await new Promise((r) => setTimeout(r, 10));
        const report = creditBureau.pullReport(app.creditScore);
        scope.creditTier = report.tier;
        scope.creditFlags = report.flags;
      },
      "pull-credit-report",
    )
    .addFunction(
      "CalculateDTI",
      async (scope) => {
        const { app } = scope.$getArgs<LoanInput>();
        const dtiRatio =
          Math.round((app.monthlyDebts / (app.annualIncome / 12)) * 100) / 100;
        scope.dtiRatio = dtiRatio;
        scope.dtiPercent = Math.round(dtiRatio * 100);
        scope.dtiStatus = dtiRatio > 0.43 ? "excessive" : "healthy";
        scope.dtiFlags =
          dtiRatio > 0.43
            ? [`DTI at ${Math.round(dtiRatio * 100)}% exceeds 43%`]
            : [];
      },
      "calculate-dti",
    )
    .addFunction(
      "VerifyEmployment",
      async (scope) => {
        const { app } = scope.$getArgs<LoanInput>();
        await new Promise((r) => setTimeout(r, 5));
        const result = employerVerification.verify(
          app.employmentStatus,
          app.employmentYears,
        );
        scope.employmentVerified = result.verified;
        scope.employmentFlags = result.flags;
      },
      "verify-employment",
    )
    .addFunction(
      "AssessRisk",
      async (scope) => {
        const riskTier =
          !scope.employmentVerified ||
          scope.dtiStatus === "excessive" ||
          scope.creditTier === "poor"
            ? "high"
            : "low";
        scope.riskTier = riskTier;
        scope.riskFactors = [
          ...scope.creditFlags,
          ...scope.dtiFlags,
          ...scope.employmentFlags,
        ];
      },
      "assess-risk",
    )
    .addDeciderFunction(
      "LoanDecision",
      (scope) =>
        decide(
          scope,
          [
            { when: { riskTier: { eq: "low" } }, then: "approved", label: "Low risk" },
            { when: { riskTier: { eq: "high" } }, then: "rejected", label: "High risk" },
          ],
          "manual-review",
        ),
      "loan-decision",
    )
    .addFunctionBranch("approved", "ApproveApplication", async (scope) => {
      const { app } = scope.$getArgs<LoanInput>();
      scope.decision = `${app.applicantName}: APPROVED`;
    })
    .addFunctionBranch("rejected", "RejectApplication", async (scope) => {
      const { app } = scope.$getArgs<LoanInput>();
      scope.decision = `${app.applicantName}: REJECTED — ${scope.riskFactors.join("; ")}`;
    })
    .addFunctionBranch("manual-review", "ManualReview", async (scope) => {
      const { app } = scope.$getArgs<LoanInput>();
      scope.decision = `${app.applicantName}: SENT TO MANUAL REVIEW`;
    })
    .setDefault("manual-review")
    .end()
    .build();
}
