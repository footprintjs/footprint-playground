import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// CI tests the published package boundary; authored local-development links stay
// in Git. Version changes here must be reviewed with the consumer upgrade.
export const replacements = {
  "footprint-explainable-ui": {
    "from": "file:../explainable-ui",
    "to": "2.2.0"
  },
  "footprintjs": {
    "from": "file:../footPrint",
    "to": "14.0.0"
  },
  "foottrace": {
    "from": "^1.0.0 || ^2.0.0-rc.1",
    "to": "2.1.0"
  }
};
const sections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

export function prepareCiManifest(manifest) {
  const result = structuredClone(manifest);
  for (const section of sections) {
    for (const [name, value] of Object.entries(manifest[section] ?? {})) {
      if (typeof value !== 'string' || !value.startsWith('file:')) continue;
      const rule = section === 'dependencies' ? replacements[name] : undefined;
      if (!rule || rule.from !== value) throw new Error(`Unexpected local dependency: ${section}.${name}=${value}`);
    }
  }
  for (const [name, rule] of Object.entries(replacements)) {
    if (manifest.dependencies?.[name] !== rule.from) throw new Error(`Expected authored dependency: dependencies.${name}=${rule.from}`);
    result.dependencies[name] = rule.to;
  }
  return result;
}

export function verifyCiLock(lock) {
  const { packages } = lock;
  for (const [path, entry] of Object.entries(packages)) {
    if (!path) continue;
    if (!path.startsWith('node_modules/') || entry.link || entry.resolved?.startsWith('file:')) {
      throw new Error(`Unexpected local lock entry: ${path}`);
    }
  }
  for (const [name, { to }] of Object.entries(replacements)) {
    const entry = packages[`node_modules/${name}`];
    if (entry?.version !== to || !entry.resolved?.startsWith('https://registry.npmjs.org/') || !entry.integrity) {
      throw new Error(`Expected registry lock entry: ${name}@${to}`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === '--verify-lock') {
    const filename = new URL('../package-lock.json', import.meta.url);
    verifyCiLock(JSON.parse(await readFile(filename, 'utf8')));
  } else {
    const filename = new URL('../package.json', import.meta.url);
    const original = JSON.parse(await readFile(filename, 'utf8'));
    const prepared = prepareCiManifest(original);
    for (const [name, rule] of Object.entries(replacements)) console.log(`${name}: ${rule.from} -> ${rule.to}`);
    await writeFile(filename, JSON.stringify(prepared, null, 2) + '\n');
  }
}
