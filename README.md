# FootPrint Playground

Interactive tutorial for the [FootPrint](https://github.com/footprintjs/footPrint) library. Walk through building, executing, and observing a pipeline — all in your browser.

**[Try it live](https://footprintjs.github.io/footprint-playground/)**

## What you'll experience

1. **Build** — Write pipeline code and watch the flowchart assemble in real-time
2. **Execute** — Hit Run and see data flow through each stage with live memory updates
3. **Observe** — Time-travel through execution, inspect snapshots, and explore metrics

## Run locally

Use Node.js 22 or newer. The `file:` dependencies and
`src/samples/examples -> ../../../footPrint/examples` link are intentional:
place this repository beside built `footPrint` and `explainable-ui` checkouts,
installing/building those libraries using their own instructions first.

```bash
npm install
npm test
npm run build
npm run dev
```

## Records and compatibility checks

`footprintjs` owns execution and its engine recorders on `footprintjs/trace`.
The record API comes from the public `foottrace`, `foottrace/write`, and
`foottrace/paths` doors. The teaching executor exposes all three record namespaces
while retaining engine trace exports; it is not isolation for hostile code.

The current renderer receives the graph captured by a structure recorder attached
before execution, including the credit-decision demo. It does not reconstruct a
graph from an obsolete `ExplainableShell.spec` property.

CI retains authored local links in Git. In a disposable checkout only,
`scripts/prepare-ci-dependencies.mjs` validates and reports replacement of the
known runtime links with exact reviewed public releases. Unknown file links are
refused and unrelated dependencies/peers remain unchanged. The existing lock is
regenerated without deletion, followed by `npm ci`, tests, and the full TypeScript
+ Vite build. This replaces the old deployment's stale package pins and skipped
type check. Only a successful main-branch build deploys to Pages.

## Built with

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [React Flow](https://reactflow.dev) for interactive flowcharts
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for code display
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Vite](https://vite.dev) for bundling
