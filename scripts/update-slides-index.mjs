import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const API_BASE_URL = "https://api.github.com";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_OWNER = process.env.GITHUB_OWNER ?? "wdai0";
const DEFAULT_CONFIG_PATH = path.join(repoRoot, "src/data/slides.config.json");
const DEFAULT_OUTPUT_PATH = path.join(repoRoot, "src/data/slides.generated.json");

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function parseTimestamp(value) {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

export function normalizeConfig(rawConfig = {}) {
  const denylist = new Set(
    Array.isArray(rawConfig.denylist)
      ? rawConfig.denylist.filter((value) => typeof value === "string" && value.trim().length > 0)
      : []
  );

  const overrides =
    rawConfig.overrides && typeof rawConfig.overrides === "object" ? rawConfig.overrides : {};

  return { denylist, overrides };
}

export function isDeniedRepo(repo, denylist) {
  return denylist.has(repo.full_name) || denylist.has(repo.name);
}

export function buildSlideEntry(repo, pagesSite, override = {}) {
  const entry = {
    repo: repo.full_name,
    repoUrl: repo.html_url,
    slidesUrl: override.slidesUrl ?? pagesSite.html_url,
    title: override.title?.trim() || repo.name,
    summary:
      override.summary?.trim() ||
      repo.description?.trim() ||
      `GitHub Pages site discovered from ${repo.full_name}.`,
    visibility: repo.private ? "private" : repo.visibility ?? "public",
    updatedAt: repo.updated_at ?? repo.pushed_at ?? null
  };

  if (override.date) {
    entry.date = override.date;
  }

  if (Array.isArray(override.tags) && override.tags.length > 0) {
    entry.tags = override.tags;
  }

  if (isFiniteNumber(override.order)) {
    entry.order = override.order;
  }

  return entry;
}

export function sortSlides(entries) {
  return [...entries].sort((left, right) => {
    const leftOrder = isFiniteNumber(left.order) ? left.order : Number.POSITIVE_INFINITY;
    const rightOrder = isFiniteNumber(right.order) ? right.order : Number.POSITIVE_INFINITY;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    const leftDate = parseTimestamp(left.date);
    const rightDate = parseTimestamp(right.date);
    if (leftDate !== rightDate) {
      return rightDate - leftDate;
    }

    const leftUpdated = parseTimestamp(left.updatedAt);
    const rightUpdated = parseTimestamp(right.updatedAt);
    if (leftUpdated !== rightUpdated) {
      return rightUpdated - leftUpdated;
    }

    return left.repo.localeCompare(right.repo);
  });
}

export async function collectSlidesManifest({ owner, repos, config, lookupPagesSite }) {
  const entries = [];
  const normalizedOwner = owner.toLowerCase();

  for (const repo of repos) {
    if ((repo.owner?.login ?? "").toLowerCase() !== normalizedOwner) {
      continue;
    }

    if (repo.full_name === `${owner}/${owner}.github.io`) {
      continue;
    }

    if (repo.is_template) {
      continue;
    }

    if (isDeniedRepo(repo, config.denylist)) {
      continue;
    }

    if (repo.has_pages === false) {
      continue;
    }

    const pagesSite = await lookupPagesSite(repo);
    if (!pagesSite?.html_url) {
      continue;
    }

    const override = config.overrides[repo.full_name] ?? config.overrides[repo.name] ?? {};
    entries.push(buildSlideEntry(repo, pagesSite, override));
  }

  const slides = sortSlides(entries).map(({ order, ...entry }) => entry);

  return {
    generatedAt: new Date().toISOString(),
    owner,
    slides
  };
}

async function readJson(filePath) {
  const contents = await fs.readFile(filePath, "utf8");
  return JSON.parse(contents);
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function fetchJson(url, token, { allow404 = false } = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "wdai0-slides-index",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (allow404 && response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API request failed for ${url}: ${response.status} ${response.statusText} ${body}`.trim());
  }

  return response.json();
}

async function listOwnedRepos(owner, token) {
  const repos = [];
  const normalizedOwner = owner.toLowerCase();

  for (let page = 1; ; page += 1) {
    const pageRepos = await fetchJson(
      `${API_BASE_URL}/user/repos?affiliation=owner&visibility=all&sort=updated&per_page=100&page=${page}`,
      token
    );

    if (!Array.isArray(pageRepos) || pageRepos.length === 0) {
      break;
    }

    repos.push(
      ...pageRepos.filter((repo) => (repo.owner?.login ?? "").toLowerCase() === normalizedOwner)
    );

    if (pageRepos.length < 100) {
      break;
    }
  }

  return repos;
}

async function fetchPagesSite(owner, repoName, token) {
  return fetchJson(`${API_BASE_URL}/repos/${owner}/${repoName}/pages`, token, { allow404: true });
}

export async function generateSlidesIndex({
  owner = DEFAULT_OWNER,
  token = process.env.SLIDES_INDEX_TOKEN,
  configPath = DEFAULT_CONFIG_PATH,
  outputPath = DEFAULT_OUTPUT_PATH
} = {}) {
  if (!token) {
    throw new Error(
      "Missing SLIDES_INDEX_TOKEN. Set a fine-grained PAT with read-only Metadata and Pages permissions before running the slides index generator."
    );
  }

  const config = normalizeConfig(await readJson(configPath));
  const repos = await listOwnedRepos(owner, token);
  const manifest = await collectSlidesManifest({
    owner,
    repos,
    config,
    lookupPagesSite: (repo) => fetchPagesSite(owner, repo.name, token)
  });

  await writeJson(outputPath, manifest);
  return manifest;
}

async function main() {
  const manifest = await generateSlidesIndex();
  console.log(
    `Wrote ${manifest.slides.length} slide entries to ${path.relative(repoRoot, DEFAULT_OUTPUT_PATH)}.`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
