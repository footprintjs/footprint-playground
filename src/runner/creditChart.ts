import { flowChart, decide } from "footprintjs";
import { createTraceStructureRecorder } from "footprint-explainable-ui/flowchart";
import { z } from "zod";

export interface ApplicantData {
  applicantName: string;
  creditScore: number;
  monthlyIncome: number;
  monthlyDebts: number;
}

interface CreditState {
  dti: number;
  riskFactors: string[];
  decision: string;
}

/** Build the tool and its chart together; the recorder owns the visual graph. */
export function buildCreditChart() {
  const trace = createTraceStructureRecorder({ id: "credit-demo-trace" });
  const builder = flowChart<CreditState>(
    "AssessCredit",
    async (scope) => {
      const input = scope.$getArgs<ApplicantData>();
      scope.dti = Math.round((input.monthlyDebts / input.monthlyIncome) * 100) / 100;
      scope.riskFactors = [];
    },
    "assess-credit",
    { description: "Compute DTI and assess credit profile" },
  )
    .attachStructureRecorder(trace.recorder)
    .addDeciderFunction(
      "CreditDecision",
      (scope) => {
        const args = scope.$getArgs<ApplicantData>();
        return decide(scope, [
          { when: (s) => args.creditScore >= 700 && s.dti < 0.43, then: "approved", label: "Strong credit profile" },
          { when: () => args.creditScore < 580, then: "rejected", label: "Credit score below minimum" },
        ], "manual-review");
      },
      "credit-decision",
      "Route based on credit score and DTI",
    )
    .addFunctionBranch("approved", "Approve", async (scope) => { scope.decision = "APPROVED"; }, "Issue approval")
    .addFunctionBranch("rejected", "Reject", async (scope) => { scope.decision = "REJECTED"; }, "Issue rejection")
    .addFunctionBranch("manual-review", "ManualReview", async (scope) => { scope.decision = "MANUAL REVIEW"; }, "Flag for underwriter")
    .setDefault("manual-review")
    .end()
    .contract({
      input: z.object({
        applicantName: z.string(),
        creditScore: z.number(),
        monthlyIncome: z.number(),
        monthlyDebts: z.number(),
      }),
    });

  const chart = builder.build();
  return { chart, traceGraph: trace.getGraph(), mcpTool: chart.toMCPTool() };
}
