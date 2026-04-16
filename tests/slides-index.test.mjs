import assert from "node:assert/strict";
import test from "node:test";

import {
  collectSlidesManifest,
  normalizeConfig,
  sortSlides
} from "../scripts/update-slides-index.mjs";

function makeRepo({
  name,
  privateRepo = false,
  isTemplate = false,
  hasPages = true,
  updatedAt = "2026-04-15T12:00:00.000Z",
  description = ""
}) {
  return {
    name,
    full_name: `wdai0/${name}`,
    html_url: `https://github.com/wdai0/${name}`,
    owner: { login: "wdai0" },
    private: privateRepo,
    visibility: privateRepo ? "private" : "public",
    is_template: isTemplate,
    has_pages: hasPages,
    updated_at: updatedAt,
    description
  };
}

test("collectSlidesManifest skips templates, denylist entries, site repo, and repos without Pages", async () => {
  const config = normalizeConfig({
    denylist: ["wdai0/deny-me"]
  });

  const lookupCalls = [];
  const manifest = await collectSlidesManifest({
    owner: "wdai0",
    config,
    repos: [
      makeRepo({ name: "wdai0.github.io" }),
      makeRepo({ name: "template-deck", isTemplate: true }),
      makeRepo({ name: "deny-me" }),
      makeRepo({ name: "no-pages", hasPages: true }),
      makeRepo({
        name: "private-slides",
        privateRepo: true,
        description: "Slides from a private repo."
      })
    ],
    lookupPagesSite: async (repo) => {
      lookupCalls.push(repo.full_name);
      if (repo.name === "private-slides") {
        return { html_url: "https://wdai0.github.io/private-slides/" };
      }

      return null;
    }
  });

  assert.deepEqual(lookupCalls, ["wdai0/no-pages", "wdai0/private-slides"]);
  assert.equal(manifest.slides.length, 1);
  assert.equal(manifest.slides[0].repo, "wdai0/private-slides");
  assert.equal(manifest.slides[0].visibility, "private");
  assert.equal(manifest.slides[0].slidesUrl, "https://wdai0.github.io/private-slides/");
});

test("collectSlidesManifest applies overrides before writing the final manifest", async () => {
  const config = normalizeConfig({
    overrides: {
      "wdai0/references": {
        title: "References and Slide Archive",
        summary: "Override summary",
        date: "2026-04-10",
        tags: ["reading notes", "slide decks"],
        order: 1
      }
    }
  });

  const manifest = await collectSlidesManifest({
    owner: "wdai0",
    config,
    repos: [
      makeRepo({
        name: "references",
        updatedAt: "2026-04-05T11:30:00.000Z",
        description: "Base summary"
      })
    ],
    lookupPagesSite: async () => ({ html_url: "https://wdai0.github.io/references/" })
  });

  assert.deepEqual(manifest.slides, [
    {
      repo: "wdai0/references",
      repoUrl: "https://github.com/wdai0/references",
      slidesUrl: "https://wdai0.github.io/references/",
      title: "References and Slide Archive",
      summary: "Override summary",
      visibility: "public",
      updatedAt: "2026-04-05T11:30:00.000Z",
      date: "2026-04-10",
      tags: ["reading notes", "slide decks"]
    }
  ]);
});

test("sortSlides is deterministic across order, date, updatedAt, and repo name", () => {
  const sorted = sortSlides([
    { repo: "wdai0/zeta", updatedAt: "2026-04-10T10:00:00.000Z" },
    { repo: "wdai0/alpha", updatedAt: "2026-04-10T10:00:00.000Z" },
    { repo: "wdai0/date-first", updatedAt: "2026-04-01T09:00:00.000Z", date: "2026-04-12" },
    { repo: "wdai0/manual-order", updatedAt: "2026-01-01T00:00:00.000Z", order: 2 }
  ]);

  assert.deepEqual(sorted.map((entry) => entry.repo), [
    "wdai0/manual-order",
    "wdai0/date-first",
    "wdai0/alpha",
    "wdai0/zeta"
  ]);
});
