// Sample code imported as raw text strings via Vite's ?raw
// These resolve to sibling directory — allowed via vite.config.ts server.fs.allow
import linearCode from "../../../footprint-samples/examples/flowchart/01-linear.ts?raw";
import forkCode from "../../../footprint-samples/examples/flowchart/02-fork.ts?raw";
import deciderCode from "../../../footprint-samples/examples/flowchart/03-decider.ts?raw";
import selectorCode from "../../../footprint-samples/examples/flowchart/04-selector.ts?raw";
import subflowCode from "../../../footprint-samples/examples/flowchart/05-subflow.ts?raw";
import loopsCode from "../../../footprint-samples/examples/flowchart/06-loops.ts?raw";
import loanCode from "../../../footprint-samples/examples/quick-start/loan-application.ts?raw";
import inputSafetyCode from "../../../footprint-samples/examples/errors/input-safety.ts?raw";
import structuredErrorCode from "../../../footprint-samples/examples/errors/structured-error-flow.ts?raw";

export interface Sample {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
  /** Default JSON for the INPUT variable panel (like GraphiQL variables). */
  defaultInput?: string;
}

export const samples: Sample[] = [
  {
    id: "loan-application",
    name: "Loan Application",
    category: "Quick Start",
    description:
      "Full loan underwriting pipeline with credit check, DTI, employment verification, and conditional branching.",
    code: loanCode,
    defaultInput: JSON.stringify(
      {
        app: {
          applicantName: "Bob Martinez",
          annualIncome: 42_000,
          monthlyDebts: 2_100,
          creditScore: 580,
          employmentStatus: "self-employed",
          employmentYears: 1,
          loanAmount: 40_000,
        },
      },
      null,
      2,
    ),
  },
  {
    id: "linear",
    name: "Linear Pipeline",
    category: "Flowchart",
    description: "The simplest flow — stages execute one after another: A → B → C.",
    code: linearCode,
    defaultInput: JSON.stringify(
      { userId: 42, username: "alice" },
      null,
      2,
    ),
  },
  {
    id: "fork",
    name: "Fork (Parallel)",
    category: "Flowchart",
    description:
      "Fork runs multiple branches in parallel, then continues after all complete.",
    code: forkCode,
  },
  {
    id: "decider",
    name: "Decider (Conditional)",
    category: "Flowchart",
    description:
      "A decider inspects scope and routes to one of several branches.",
    code: deciderCode,
  },
  {
    id: "selector",
    name: "Selector",
    category: "Flowchart",
    description: "Select a subset of branches to execute based on runtime conditions.",
    code: selectorCode,
  },
  {
    id: "subflow",
    name: "Subflow",
    category: "Flowchart",
    description: "Nest one flowchart inside another as a reusable subflow.",
    code: subflowCode,
  },
  {
    id: "loops",
    name: "Loops",
    category: "Flowchart",
    description: "Loop over a stage until a condition is met.",
    code: loopsCode,
  },
  {
    id: "input-safety",
    name: "Input Safety",
    category: "Input & Validation",
    description:
      "Schema validation, readonly guards, frozen args — three layers of input protection.",
    code: inputSafetyCode,
  },
  {
    id: "structured-errors",
    name: "Structured Errors",
    category: "Input & Validation",
    description:
      "InputValidationError preserves field-level details through FlowRecorders and narrative.",
    code: structuredErrorCode,
  },
];
