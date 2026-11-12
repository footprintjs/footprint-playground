/**
 * The one reader of a run's execution tree (`getSnapshot().executionTree`).
 *
 * Two shapes exist, and the playground reads both:
 * - LIST form (footprintjs 13 and later): an array of stages in the order they
 *   ran; a fork's children are `branches`, one list per child, each in run order.
 * - LINKED form (footprintjs 12 and older, and runs saved by them): one stage
 *   object whose `next` holds the following stage and whose `children` hold a
 *   fork's children, each child itself a linked chain.
 *
 * Every reader goes through `executionStages` and `stageBranches`, so no other
 * file checks which shape it was handed. When the playground moves to
 * footprintjs 13 only, the linked arm can be deleted here and nowhere else.
 */

/** A stage as the playground reads it — structural, so it fits both footprintjs versions. */
export interface ExecutionStage {
  id?: string;
  name?: string;
  errors?: Record<string, unknown>;
  [field: string]: unknown;
}

const isStage = (value: unknown): value is ExecutionStage =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** A linked chain (`stage.next.next…`) as a list, stopping at a stage already seen (a cycle). */
function linkedChain(first: ExecutionStage): ExecutionStage[] {
  const stages: ExecutionStage[] = [];
  const seen = new Set<ExecutionStage>();
  for (let stage: unknown = first; isStage(stage) && !seen.has(stage); stage = stage.next) {
    seen.add(stage);
    stages.push(stage);
  }
  return stages;
}

/** The stages of a run (or of one branch) in the order they ran, from either shape; `[]` for anything else. */
export function executionStages(tree: unknown): ExecutionStage[] {
  if (Array.isArray(tree)) return tree.filter(isStage);
  return isStage(tree) ? linkedChain(tree) : [];
}

/** A fork stage's child branches, one list of stages per child in run order; `[]` when it has none. */
export function stageBranches(stage: ExecutionStage): ExecutionStage[][] {
  if (Array.isArray(stage.branches)) return stage.branches.map(executionStages);
  if (Array.isArray(stage.children)) return stage.children.filter(isStage).map(linkedChain);
  return [];
}
