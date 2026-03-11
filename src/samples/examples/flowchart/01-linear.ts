/**
 * Flowchart: Linear Pipeline
 *
 * The simplest flow — stages execute one after another.
 *
 *   A → B → C
 *
 * In the playground, edit the INPUT panel to change the user data.
 *
 * Run:  npm run flow:linear
 */

import {
  flowChart,
  FlowChartExecutor,
  ScopeFacade,
  NarrativeRecorder,
  CombinedNarrativeBuilder,
} from 'footprint';

(async () => {

// INPUT is provided via the playground's JSON input panel.
// When running standalone, fall back to default values.
const input: { userId: number; username: string } =
  (typeof INPUT !== 'undefined' && INPUT) || { userId: 42, username: 'alice' };

const recorder = new NarrativeRecorder({ id: 'linear', detail: 'full' });

const chart = flowChart('FetchUser', async (scope: ScopeFacade) => {
  const { userId, username } = scope.getArgs<{ userId: number; username: string }>();
  console.log(`Fetched user #${userId}: ${username}`);
})
  .setEnableNarrative()
  .addFunction('EnrichProfile', async (scope: ScopeFacade) => {
    const { username } = scope.getArgs<{ userId: number; username: string }>();
    scope.setValue('displayName', username.charAt(0).toUpperCase() + username.slice(1));
    scope.setValue('role', 'admin');
  })
  .addFunction('FormatOutput', async (scope: ScopeFacade) => {
    const displayName = scope.getValue('displayName') as string;
    const role = scope.getValue('role') as string;
    scope.setValue('greeting', `Welcome back, ${displayName} (${role})!`);
  })
  .build();

const scopeFactory = (ctx: any, stageName: string, readOnly?: unknown) => {
  const scope = new ScopeFacade(ctx, stageName, readOnly);
  scope.attachRecorder(recorder);
  return scope;
};

const executor = new FlowChartExecutor(chart, scopeFactory);
await executor.run({ input });

const narrative = new CombinedNarrativeBuilder().build(
  executor.getFlowNarrative(),
  recorder,
);

console.log('=== Linear Pipeline ===\n');
narrative.forEach((line) => console.log(`  ${line}`));
})().catch(console.error);
