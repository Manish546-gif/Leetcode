import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const DATA_PATH = path.join(ROOT_DIR, "server", "data", "problems.json");
const STATS_PATH = path.join(ROOT_DIR, "stats.json");
const README_PATH = path.join(ROOT_DIR, "README.md");
const PROBLEM_DIR_PATTERN = /^\d{3,4}-/;
const MAX_DETAIL_BYTES = 200_000;

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function titleFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function readTextFile(filePath, maxBytes = MAX_DETAIL_BYTES) {
  try {
    const stat = await fs.stat(filePath);
    if (stat.size > maxBytes) {
      return null;
    }
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    return null;
  }
}

function extractTitleFromReadme(readme) {
  if (!readme) return "";
  const firstHeading = readme
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("#"));
  if (!firstHeading) return "";
  return firstHeading.replace(/^#+\s*/, "").trim();
}

async function findCppFile(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const cppEntry = entries.find((entry) => entry.isFile() && entry.name.endsWith(".cpp"));
    return cppEntry ? path.join(dirPath, cppEntry.name) : null;
  } catch (error) {
    return null;
  }
}

function buildJsonIndex(jsonProblems) {
  const index = new Map();
  jsonProblems.forEach((problem) => {
    if (problem && problem.id) {
      index.set(problem.id, problem);
    }
  });
  return index;
}

function normalizeDifficulty(value) {
  const normalized = (value || "").toString().trim().toLowerCase();
  if (!normalized || normalized === "unspecified") {
    return "";
  }
  if (normalized === "easy" || normalized === "medium" || normalized === "hard") {
    return normalized;
  }
  return "";
}

function buildReadmeTopicMap(readme) {
  const topicMap = {};
  let currentTopic = "";

  for (const line of readme.split("\n")) {
    const topicMatch = line.match(/^## (.+)$/);
    if (topicMatch) {
      currentTopic = topicMatch[1].trim();
      continue;
    }

    const problemMatch = line.match(/\[([^\]]+)\]\(/);
    if (problemMatch && currentTopic) {
      const slug = problemMatch[1].trim();
      if (!topicMap[slug]) {
        topicMap[slug] = [];
      }
      if (!topicMap[slug].includes(currentTopic)) {
        topicMap[slug].push(currentTopic);
      }
    }
  }

  return topicMap;
}

async function scanProblemsFromFs(jsonProblems, stats, topicMap) {
  const index = buildJsonIndex(jsonProblems);
  const entries = await fs.readdir(ROOT_DIR, { withFileTypes: true });
  const problems = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !PROBLEM_DIR_PATTERN.test(entry.name)) {
      continue;
    }

    const folderName = entry.name;
    const match = folderName.match(/^(\d+)-(.+)$/);
    const number = match ? Number(match[1]) : null;
    const slug = match ? match[2] : folderName;
    const dirPath = path.join(ROOT_DIR, folderName);

    const readmePath = path.join(dirPath, "README.md");
    const readme = await readTextFile(readmePath);
    const title = extractTitleFromReadme(readme) || titleFromSlug(slug);
    const codePath = await findCppFile(dirPath);
    const codeStat = codePath ? await fs.stat(codePath) : null;
    const readmeStat = readme ? await fs.stat(readmePath) : null;

    const lastUpdated = [codeStat, readmeStat]
      .filter(Boolean)
      .map((stat) => stat.mtime.toISOString())
      .sort()
      .pop();

    const jsonProblem = index.get(folderName) || {};
    const statsDifficulty = normalizeDifficulty(
      stats?.leetcode?.shas?.[folderName]?.difficulty
    );
    const jsonDifficulty = normalizeDifficulty(jsonProblem.difficulty);
    const readmeTopics = topicMap[folderName] || [];
    const existingTopics = jsonProblem.topics || [];
    const topics = existingTopics.length > 0 ? existingTopics : readmeTopics;

    problems.push({
      id: folderName,
      number: Number.isFinite(number) ? number : jsonProblem.number || 0,
      title: jsonProblem.title || title,
      slug: jsonProblem.slug || slug,
      difficulty: jsonDifficulty || statsDifficulty || "",
      topics,
      status: jsonProblem.status || "solved",
      lastUpdated: jsonProblem.lastUpdated || lastUpdated || "",
      path: folderName,
    });
  }

  return problems.sort((a, b) => (a.number || 0) - (b.number || 0));
}

async function main() {
  const jsonProblems = await readJson(DATA_PATH, []);
  const stats = await readJson(STATS_PATH, null);
  let topicMap = {};
  try {
    const readme = await fs.readFile(README_PATH, "utf-8");
    topicMap = buildReadmeTopicMap(readme);
  } catch (error) {
    // README may not exist
  }
  const problems = await scanProblemsFromFs(jsonProblems, stats, topicMap);
  const next = `${JSON.stringify(problems, null, 2)}\n`;

  let current = "";
  try {
    current = await fs.readFile(DATA_PATH, "utf-8");
  } catch (error) {
    current = "";
  }

  if (current === next) {
    return;
  }

  await fs.writeFile(DATA_PATH, next);
}

main().catch((error) => {
  console.error("Failed to sync problems.json:", error.message);
  process.exit(1);
});
