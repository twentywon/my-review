// Applies drizzle/*.sql to the local development D1 database (.wrangler/state),
// the same one `npm run dev` uses. Safe to rerun: applied migrations are skipped.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const { d1 } = JSON.parse(readFileSync(root + ".openai/hosting.json", "utf8"));
if (!d1) throw new Error("No `d1` binding is set in .openai/hosting.json.");

// Must match the local binding in vite.config.ts.
const name = "site-creator-d1";
mkdirSync(root + ".wrangler", { recursive: true });
const config = root + ".wrangler/db-local.json";
writeFileSync(config, JSON.stringify({
  name: "taste-notes-db-local",
  compatibility_date: "2026-05-15",
  d1_databases: [{
    binding: d1,
    database_name: name,
    database_id: "00000000-0000-4000-8000-000000000000",
    migrations_dir: "../drizzle",
  }],
}));

const result = spawnSync(process.execPath, [
  root + "node_modules/wrangler/bin/wrangler.js",
  "d1", "migrations", "apply", name,
  "--local", "--persist-to", root + ".wrangler/state", "--config", config,
], { cwd: root, stdio: "inherit", env: { ...process.env, CI: "1" } });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
