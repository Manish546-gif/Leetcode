import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const DATA_PATH = path.join(ROOT_DIR, "server", "data", "gfg-problems.json");
const GITHUB_REPO = process.env.GITHUB_REPO || "";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_API_BASE = GITHUB_REPO
  ? `https://api.github.com/repos/${GITHUB_REPO}/contents`
  : "";
const githubHeaders = GITHUB_TOKEN
  ? { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" }
  : { Accept: "application/vnd.github.v3+json" };

const MAX_DETAIL_BYTES = 200_000;

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

async function readTextFile(filePath, maxBytes = MAX_DETAIL_BYTES) {
  try {
    const stat = await fs.stat(filePath);
    if (stat.size > maxBytes) return null;
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    return null;
  }
}

async function fetchGithubFile(filePath) {
  if (!GITHUB_API_BASE) return null;
  try {
    const url = `${GITHUB_API_BASE}/${filePath}`;
    const headers = GITHUB_TOKEN
      ? { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3.raw" }
      : { Accept: "application/vnd.github.v3.raw" };
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    return null;
  }
}

async function fetchGithubDir(dirPath) {
  if (!GITHUB_API_BASE) return null;
  try {
    const url = `${GITHUB_API_BASE}/${dirPath}`;
    const response = await fetch(url, { headers: githubHeaders });
    if (!response.ok) return null;
    const entries = await response.json();
    return Array.isArray(entries) ? entries : null;
  } catch (error) {
    return null;
  }
}

function parseGfgReadme(html) {
  if (!html) return { title: "", description: "", topics: [], companies: [], difficulty: "" };

  const titleMatch = html.match(/<h2>.*?<a[^>]*>([^<]+)<\/a>.*?<\/h2>/s);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const difficultyMatch = html.match(/Difficulty Level\s*:\s*Difficulty:\s*(\w+)/i);
  const difficulty = difficultyMatch ? difficultyMatch[1].trim().toLowerCase() : "";

  const topicMatch = html.match(/Topic Tags\s*:.*?<\/p>\s*<p>(.*?)<\/p>/is);
  let topics = [];
  if (topicMatch) {
    const tagMatches = topicMatch[1].match(/<code>([^<]+)<\/code>/g);
    if (tagMatches) {
      topics = tagMatches.map((tag) => tag.replace(/<\/?code>/g, "").trim());
    }
  }

  const companyMatch = html.match(/Company Tags\s*:.*?<\/p>\s*<p>(.*?)<\/p>/is);
  let companies = [];
  if (companyMatch) {
    const tagMatches = companyMatch[1].match(/<code>([^<]+)<\/code>/g);
    if (tagMatches) {
      companies = tagMatches.map((tag) => tag.replace(/<\/?code>/g, "").trim());
    }
  }

  const contentMatch = html.match(/problems_problem_content[^"]*">\s*([\s\S]*?)(?:<\/div>\s*<p|$)/);
  const description = contentMatch ? contentMatch[1].trim() : html;

  return { title, description, topics, companies, difficulty };
}

function slugFromTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeDifficulty(value) {
  const normalized = (value || "").toString().trim().toLowerCase();
  if (["easy", "medium", "hard"].includes(normalized)) return normalized;
  return "unspecified";
}

async function scanLocal() {
  try {
    await fs.access(ROOT_DIR);
  } catch {
    return null;
  }

  let entries;
  try {
    entries = await fs.readdir(ROOT_DIR, { withFileTypes: true });
  } catch {
    return null;
  }

  const gfgDirs = entries.filter((e) => e.isDirectory() && /^Difficulty:/i.test(e.name));
  if (gfgDirs.length === 0) return null;

  const problems = [];

  for (const gfgDir of gfgDirs) {
    const dirName = gfgDir.name;
    const difficultyMatch = dirName.match(/^Difficulty:\s*(\w+)$/i);
    const folderDifficulty = difficultyMatch ? difficultyMatch[1].toLowerCase() : "";

    let subEntries;
    try {
      subEntries = await fs.readdir(path.join(ROOT_DIR, dirName), { withFileTypes: true });
    } catch {
      continue;
    }

    const problemSubDirs = subEntries.filter((e) => e.isDirectory());

    for (const sub of problemSubDirs) {
      const problemDir = path.join(ROOT_DIR, dirName, sub.name);
      const readme = await readTextFile(path.join(problemDir, "README.md"));
      const parsed = parseGfgReadme(readme);

      let codeFile = "";
      try {
        const files = await fs.readdir(problemDir);
        const cpp = files.find((f) => f.endsWith(".cpp"));
        if (cpp) codeFile = cpp;
      } catch {}

      const id = `gfg-${slugFromTitle(parsed.title || sub.name)}`;

      problems.push({
        id,
        title: parsed.title || sub.name,
        slug: slugFromTitle(parsed.title || sub.name),
        difficulty: normalizeDifficulty(parsed.difficulty || folderDifficulty),
        topics: parsed.topics,
        companies: parsed.companies,
        status: "solved",
        lastUpdated: new Date().toISOString(),
        path: `${dirName}/${sub.name}`,
        platform: "gfg",
        codeFile,
      });
    }
  }

  return problems;
}

async function scanGithub() {
  if (!GITHUB_API_BASE) return null;

  const rootEntries = await fetchGithubDir("");
  if (!rootEntries) return null;

  const gfgDirs = rootEntries.filter(
    (e) => e.type === "dir" && /^Difficulty:\s*\w+$/i.test(e.name)
  );

  const problems = [];

  for (const gfgDir of gfgDirs) {
    const dirName = gfgDir.name;
    const difficultyMatch = dirName.match(/^Difficulty:\s*(\w+)$/i);
    const folderDifficulty = difficultyMatch ? difficultyMatch[1].toLowerCase() : "";

    const subEntries = await fetchGithubDir(encodeURIComponent(dirName));
    if (!subEntries) continue;

    const problemSubDirs = subEntries.filter((e) => e.type === "dir");

    for (const sub of problemSubDirs) {
      const encodedDirName = encodeURIComponent(dirName);
      const problemPath = `${encodedDirName}/${encodeURIComponent(sub.name)}`;
      const problemEntries = await fetchGithubDir(problemPath);
      if (!problemEntries) continue;

      const readmeEntry = problemEntries.find((e) => e.name === "README.md");
      const cppEntry = problemEntries.find((e) => e.name.endsWith(".cpp"));

      let readme = null;
      if (readmeEntry) {
        readme = await fetchGithubFile(`${problemPath}/README.md`);
      }

      const parsed = parseGfgReadme(readme);
      const id = `gfg-${slugFromTitle(parsed.title || sub.name)}`;

      problems.push({
        id,
        title: parsed.title || sub.name,
        slug: slugFromTitle(parsed.title || sub.name),
        difficulty: normalizeDifficulty(parsed.difficulty || folderDifficulty),
        topics: parsed.topics,
        companies: parsed.companies,
        status: "solved",
        lastUpdated: new Date().toISOString(),
        path: `${dirName}/${sub.name}`,
        platform: "gfg",
        codeFile: cppEntry ? cppEntry.name : "",
      });
    }
  }

  return problems;
}

async function main() {
  const existingProblems = await readJson(DATA_PATH, []);
  const existingIndex = new Map(existingProblems.map((p) => [p.id, p]));

  let problems = await scanLocal();
  if (!problems) {
    problems = await scanGithub();
  }
  if (!problems) {
    console.log("No GFG directories found. Skipping sync.");
    return;
  }

  for (const problem of problems) {
    const existing = existingIndex.get(problem.id);
    if (existing) {
      problem.topics = problem.topics.length > 0 ? problem.topics : (existing.topics || []);
      problem.companies = problem.companies.length > 0 ? problem.companies : (existing.companies || []);
      problem.status = existing.status || "solved";
      problem.lastUpdated = existing.lastUpdated || problem.lastUpdated;
    }
  }

  problems.sort((a, b) => a.title.localeCompare(b.title));

  const next = `${JSON.stringify(problems, null, 2)}\n`;
  let current = "";
  try {
    current = await fs.readFile(DATA_PATH, "utf-8");
  } catch (error) {
    current = "";
  }

  if (current === next) {
    console.log("GFG problems.json unchanged.");
    return;
  }

  await fs.writeFile(DATA_PATH, next);
  console.log(`Synced ${problems.length} GFG problems.`);
}

main().catch((error) => {
  console.error("Failed to sync GFG problems:", error.message);
  process.exit(1);
});
