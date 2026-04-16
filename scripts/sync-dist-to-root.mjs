import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const defaultDistPath = path.join(repoRoot, "dist");

async function copyEntry(sourcePath, destinationPath) {
  const sourceStats = await fs.stat(sourcePath);

  if (sourceStats.isDirectory()) {
    await fs.mkdir(destinationPath, { recursive: true });
    const entries = await fs.readdir(sourcePath, { withFileTypes: true });
    for (const entry of entries) {
      await copyEntry(path.join(sourcePath, entry.name), path.join(destinationPath, entry.name));
    }
    return;
  }

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.copyFile(sourcePath, destinationPath);
}

export async function syncDistToRoot({
  distPath = defaultDistPath,
  rootPath = repoRoot,
  staleTargets = ["slides.html"]
} = {}) {
  const distEntries = await fs.readdir(distPath, { withFileTypes: true });

  for (const entry of distEntries) {
    const sourcePath = path.join(distPath, entry.name);
    const destinationPath = path.join(rootPath, entry.name);

    await fs.rm(destinationPath, { recursive: true, force: true });
    await copyEntry(sourcePath, destinationPath);
  }

  for (const staleTarget of staleTargets) {
    await fs.rm(path.join(rootPath, staleTarget), { recursive: true, force: true });
  }
}

async function main() {
  await syncDistToRoot();
  console.log(
    `Synchronized ${path.relative(repoRoot, defaultDistPath)} to the publishable branch root.`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
