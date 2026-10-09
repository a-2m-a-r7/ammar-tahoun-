import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const projectsFilePath = path.join(rootDir, "data", "projects.json");
const profileFilePath = path.join(rootDir, "data", "profile.json");

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || "a-2m-a-r7";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

async function fetchRepoFromGitHub(repoName) {
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}`;
  const headers = {
    "User-Agent": "AmmarTahoon-Portfolio-Sync",
    Accept: "application/vnd.github.v3+json"
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      if (res.status === 403 || res.status === 429) {
        console.warn(`[sync] Rate limit hit for ${repoName}. Skipping update.`);
        return null;
      }
      console.warn(`[sync] HTTP ${res.status} fetching ${repoName}.`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[sync] Network error fetching ${repoName}:`, err.message);
    return null;
  }
}

async function syncProjects() {
  console.log(`[sync] Starting project sync for user '${GITHUB_USERNAME}'...`);

  let currentProjects = [];
  try {
    const raw = await fs.readFile(projectsFilePath, "utf8");
    currentProjects = JSON.parse(raw);
  } catch (err) {
    console.error("[sync] Could not read existing data/projects.json:", err.message);
    process.exit(1);
  }

  let updatedCount = 0;

  const nextProjects = await Promise.all(
    currentProjects.map(async (project) => {
      const repoId = project.id || project.slug;
      if (!repoId) return project;

      const repoData = await fetchRepoFromGitHub(repoId);
      if (!repoData) {
        // Fall back gracefully to existing data
        return project;
      }

      updatedCount += 1;
      return {
        ...project,
        stars: repoData.stargazers_count ?? project.stars ?? 0,
        forks: repoData.forks_count ?? project.forks ?? 0,
        lastUpdated: repoData.pushed_at || project.lastUpdated,
        repo: repoData.html_url || project.repo,
        live: project.live || repoData.homepage || "",
        topics: repoData.topics?.length ? repoData.topics : (project.topics || [])
      };
    })
  );

  await fs.writeFile(projectsFilePath, JSON.stringify(nextProjects, null, 2), "utf8");
  console.log(`[sync] Saved ${nextProjects.length} projects to data/projects.json (${updatedCount} updated from GitHub).`);

  // Mirror into data/profile.json for complete backward compatibility
  try {
    const profileRaw = await fs.readFile(profileFilePath, "utf8");
    const profileData = JSON.parse(profileRaw);

    profileData.projects = nextProjects.map((p) => ({
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      category: p.category,
      year: p.year,
      image: p.image,
      stack: p.stack,
      metrics: p.metrics,
      details: {
        challenge: p.details?.problem || p.details?.challenge || "",
        solution: p.details?.solution || "",
        impact: p.details?.impact || []
      },
      links: {
        live: p.live || "#",
        repo: p.repo || "#",
        caseStudy: p.slug ? `#${p.slug}` : "#"
      }
    }));

    await fs.writeFile(profileFilePath, JSON.stringify(profileData, null, 2), "utf8");
    console.log(`[sync] Successfully synchronized ${profileData.projects.length} real projects into data/profile.json.`);
  } catch (err) {
    console.warn("[sync] Could not update profile.json:", err.message);
  }
}

syncProjects().catch((err) => {
  console.error("[sync] Unhandled error:", err);
  process.exit(1);
});
