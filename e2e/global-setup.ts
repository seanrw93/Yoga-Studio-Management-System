import { execSync } from "node:child_process";
import path from "node:path";
import { DATABASE_URL } from "./env";

// Rebuild the E2E database from schema.prisma and reseed it, so every run starts identical.
// db push (not migrate reset) because migrations are gitignored in this repo.
export default function globalSetup() {
  const run = (command: string) =>
    execSync(command, {
      cwd: path.resolve(__dirname, "../backend"),
      env: { ...process.env, DATABASE_URL },
      stdio: "inherit",
    });

  run("npx prisma db push --force-reset --skip-generate");
  run("npm run prisma:seed");
}
