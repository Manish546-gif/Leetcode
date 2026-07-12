import chokidar from "chokidar";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs/promises";
import mongoose from "mongoose";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(__dirname, "data", "problems.json");
const GFG_DATA_PATH = path.join(__dirname, "data", "gfg-problems.json");
const DASHBOARD_STATE_PATH = path.join(__dirname, "data", "dashboard-state.json");
const PROBLEM_DIR_PATTERN = /^\d{3,4}-/;
const GFG_DIR_PATTERN = /^Difficulty:/;
const MAX_DETAIL_BYTES = 200_000;
const EXEC_TIMEOUT_MS = 4000;
const GITHUB_REPO = process.env.GITHUB_REPO || "";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_RAW_BASE = GITHUB_REPO
  ? `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`
  : "";
const GITHUB_API_BASE = GITHUB_REPO
  ? `https://api.github.com/repos/${GITHUB_REPO}/contents`
  : "";
const githubHeaders = GITHUB_TOKEN
  ? { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" }
  : { Accept: "application/vnd.github.v3+json" };

app.use(express.json());
const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://glowing-computing-machine-4jwwvpwvv9xq3vqp-4000.app.github.dev",
  "https://glowing-computing-machine-4jwwvpwvv9xq3vqp-5173.app.github.dev",
  "https://leetcode-sigma-two.vercel.app",
];

const envOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = envOrigins.length ? envOrigins : defaultOrigins;
const allowAllOrigins = !allowedOrigins.length;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowAllOrigins) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

let ProblemModel = null;
let KeyPointModel = null;
let ProblemNotesModel = null;
let DashboardStateModel = null;
let mongoReady = false;
let cachedProblems = [];
let cachedGfgProblems = [];
let cacheReady = false;
let gfgCacheReady = false;
let watcher = null;
let dataWatcher = null;
let refreshTimer = null;

const problemSchema = new mongoose.Schema(
  {
    id: String,
    number: Number,
    title: String,
    slug: String,
    difficulty: String,
    topics: [String],
    status: String,
    lastUpdated: String,
    path: String,
  },
  { timestamps: true }
);

const keyPointSchema = new mongoose.Schema(
  {
    problemId: String,
    points: [String],
  },
  { timestamps: true }
);

const problemNotesSchema = new mongoose.Schema(
  {
    problemId: String,
    hints: [String],
    algorithm: String,
    timeComplexity: String,
    spaceComplexity: String,
    edgeCases: [String],
    codeSnippets: [
      {
        title: String,
        code: String,
        language: String,
      },
    ],
    solutionNotes: String,
    relatedProblems: [String],
    practiceCount: { type: Number, default: 0 },
    lastPracticed: Date,
    difficulty: String,
  },
  { timestamps: true }
);

const dashboardStateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    state: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

async function connectMongo() {
  if (!process.env.MONGO_URI) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    ProblemModel = mongoose.model("Problem", problemSchema);
    KeyPointModel = mongoose.model("KeyPoint", keyPointSchema);
    ProblemNotesModel = mongoose.model("ProblemNotes", problemNotesSchema);
    DashboardStateModel = mongoose.model("DashboardState", dashboardStateSchema);
    mongoReady = true;
    console.log("MongoDB connected.");
  } catch (error) {
    console.warn("MongoDB connection failed. Falling back to JSON.");
    console.warn(error.message);
  }
}

async function fetchFromGithub(filePath) {
  if (!GITHUB_RAW_BASE) return null;

  try {
    const url = `${GITHUB_RAW_BASE}/${filePath}`;
    const headers = GITHUB_TOKEN
      ? { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3.raw" }
      : { Accept: "application/vnd.github.v3.raw" };
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    console.warn(`GitHub fetch failed for ${filePath}:`, error.message);
    return null;
  }
}

async function fetchProblemDirFromGithub(dirName) {
  if (!GITHUB_API_BASE) return null;

  try {
    const url = `${GITHUB_API_BASE}/${dirName}`;
    const response = await fetch(url, { headers: githubHeaders });
    if (!response.ok) return null;
    const entries = await response.json();
    if (!Array.isArray(entries)) return null;

    const result = {};
    for (const entry of entries) {
      if (entry.type === "file" && (entry.name.endsWith(".cpp") || entry.name === "README.md")) {
        const content = await fetchFromGithub(`${dirName}/${entry.name}`);
        if (content !== null) {
          result[entry.name] = content;
        }
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.warn(`GitHub dir fetch failed for ${dirName}:`, error.message);
    return null;
  }
}

async function loadJsonProblems() {
  if (GITHUB_RAW_BASE) {
    const raw = await fetchFromGithub("server/data/problems.json");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.warn("Failed to parse GitHub problems.json:", error.message);
      }
    }
  }

  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function loadGfgProblems() {
  if (GITHUB_RAW_BASE) {
    const raw = await fetchFromGithub("server/data/gfg-problems.json");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (error) {
        console.warn("Failed to parse GitHub gfg-problems.json:", error.message);
      }
    }
  }

  try {
    const raw = await fs.readFile(GFG_DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function loadDashboardStateFromFile() {
  try {
    const raw = await fs.readFile(DASHBOARD_STATE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : { key: "global", state: {} };
  } catch (error) {
    return { key: "global", state: {} };
  }
}

async function saveDashboardStateToFile(state) {
  const payload = {
    key: "global",
    state: state || {},
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(DASHBOARD_STATE_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

async function readDashboardState() {
  if (mongoReady && DashboardStateModel) {
    const document = await DashboardStateModel.findOne({ key: "global" }).lean();
    return document || { key: "global", state: {} };
  }

  return loadDashboardStateFromFile();
}

async function writeDashboardState(state) {
  if (mongoReady && DashboardStateModel) {
    const updated = await DashboardStateModel.findOneAndUpdate(
      { key: "global" },
      { key: "global", state: state || {} },
      { upsert: true, new: true }
    ).lean();

    return updated || { key: "global", state: state || {} };
  }

  return saveDashboardStateToFile(state);
}

async function getAllProblems() {
  if (cacheReady) {
    return cachedProblems;
  }

  cachedProblems = await loadJsonProblems();
  cacheReady = true;
  return cachedProblems;
}

async function getAllGfgProblems() {
  if (gfgCacheReady) {
    return cachedGfgProblems;
  }

  cachedGfgProblems = await loadGfgProblems();
  gfgCacheReady = true;
  return cachedGfgProblems;
}

function normalizeValue(value) {
  return (value || "").toString().trim().toLowerCase();
}

function isSafeProblemId(value) {
  return /^[a-z0-9-]+$/i.test(value || "");
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

async function scanProblemsFromFs(jsonProblems) {
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
    problems.push({
      id: folderName,
      number: Number.isFinite(number) ? number : jsonProblem.number || 0,
      title: jsonProblem.title || title,
      slug: jsonProblem.slug || slug,
      difficulty: jsonProblem.difficulty || "",
      topics: jsonProblem.topics || [],
      status: jsonProblem.status || "solved",
      lastUpdated: jsonProblem.lastUpdated || lastUpdated || "",
      path: folderName,
    });
  }

  return problems.sort((a, b) => (a.number || 0) - (b.number || 0));
}

async function refreshCache(reason) {
  const jsonProblems = await loadJsonProblems();
  const scanned = await scanProblemsFromFs(jsonProblems);
  cachedProblems = scanned.length ? scanned : jsonProblems;
  cacheReady = true;

  if (scanned.length && process.env.WRITE_PROBLEM_JSON !== "false") {
    const next = `${JSON.stringify(cachedProblems, null, 2)}\n`;
    let current = "";
    try {
      current = await fs.readFile(DATA_PATH, "utf-8");
    } catch (error) {
      current = "";
    }

    if (current !== next) {
      await fs.writeFile(DATA_PATH, next);
    }
  }

  const gfgProblems = await loadGfgProblems();
  cachedGfgProblems = gfgProblems;
  gfgCacheReady = true;

  if (reason) {
    console.log(`Problem cache refreshed (${reason}).`);
  }
}

function scheduleRefresh(reason) {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  refreshTimer = setTimeout(() => {
    refreshCache(reason).catch((error) => {
      console.warn("Failed to refresh problem cache:", error.message);
    });
  }, 200);
}

function startWatcher() {
  if (watcher || dataWatcher) return;

  watcher = chokidar.watch(ROOT_DIR, {
    ignored: ["**/node_modules/**", "**/.git/**", "**/client/**", "**/server/**"],
    ignoreInitial: true,
    depth: 2,
  });

  watcher.on("add", () => scheduleRefresh("file added"));
  watcher.on("change", () => scheduleRefresh("file changed"));
  watcher.on("unlink", () => scheduleRefresh("file removed"));
  watcher.on("addDir", () => scheduleRefresh("dir added"));
  watcher.on("unlinkDir", () => scheduleRefresh("dir removed"));

  dataWatcher = chokidar.watch(DATA_PATH, { ignoreInitial: true });
  dataWatcher.on("add", () => scheduleRefresh("problems.json added"));
  dataWatcher.on("change", () => scheduleRefresh("problems.json changed"));
  dataWatcher.on("unlink", () => scheduleRefresh("problems.json removed"));
}

async function getProblemDetail(problemId) {
  if (!isSafeProblemId(problemId)) {
    return null;
  }

  const problems = await getAllProblems();
  const problem = problems.find((item) => item.id === problemId);
  if (!problem) {
    return null;
  }

  let readme = null;
  let code = null;

  if (GITHUB_REPO) {
    const files = await fetchProblemDirFromGithub(problem.path);
    if (files) {
      readme = files["README.md"] || null;
      const cppFile = Object.keys(files).find((name) => name.endsWith(".cpp"));
      code = cppFile ? files[cppFile] : null;
    }
  }

  if (!readme) {
    const dirPath = path.join(ROOT_DIR, problem.path);
    readme = await readTextFile(path.join(dirPath, "README.md"));
  }

  if (!code) {
    const dirPath = path.join(ROOT_DIR, problem.path);
    const codePath = await findCppFile(dirPath);
    code = codePath ? await readTextFile(codePath) : null;
  }

  return {
    problem,
    description: readme || "",
    code: code || "",
  };
}

async function getGfgProblemDetail(problemId) {
  const problems = await getAllGfgProblems();
  const problem = problems.find((item) => item.id === problemId);
  if (!problem) return null;

  let readme = problem.description || null;
  let code = problem.code || null;

  if (GITHUB_REPO && problem.path && (!readme || !code)) {
    const parts = problem.path.split("/");
    const dirUrl = `${GITHUB_API_BASE}/${parts.map(encodeURIComponent).join("/")}`;
    console.log(`[GFG] Fetching: ${dirUrl}`);

    try {
      const dirRes = await fetch(dirUrl, { headers: githubHeaders });
      console.log(`[GFG] Status: ${dirRes.status}`);
      if (dirRes.ok) {
        const entries = await dirRes.json();
        console.log(`[GFG] Entries: ${Array.isArray(entries) ? entries.length : "not array"}`);
        if (Array.isArray(entries)) {
          const readmeEntry = entries.find((e) => e.name === "README.md");
          const cppEntry = entries.find((e) => e.name.endsWith(".cpp"));
          console.log(`[GFG] readme: ${!!readmeEntry}, cpp: ${!!cppEntry}`);

          if (readmeEntry) {
            const rawUrl = `${GITHUB_RAW_BASE}/${parts.map(encodeURIComponent).join("/")}/${encodeURIComponent("README.md")}`;
            console.log(`[GFG] Readme URL: ${rawUrl}`);
            const rawRes = await fetch(rawUrl, { headers: githubHeaders });
            console.log(`[GFG] Readme status: ${rawRes.status}`);
            if (rawRes.ok) readme = await rawRes.text();
            console.log(`[GFG] Readme len: ${(readme || "").length}`);
          }
          if (cppEntry) {
            const rawUrl = `${GITHUB_RAW_BASE}/${parts.map(encodeURIComponent).join("/")}/${encodeURIComponent(cppEntry.name)}`;
            console.log(`[GFG] Code URL: ${rawUrl}`);
            const rawRes = await fetch(rawUrl, { headers: githubHeaders });
            console.log(`[GFG] Code status: ${rawRes.status}`);
            if (rawRes.ok) code = await rawRes.text();
            console.log(`[GFG] Code len: ${(code || "").length}`);
          }
        }
      }
    } catch (err) {
      console.warn(`[GFG] GitHub fetch failed for ${problem.path}:`, err.message);
    }
  }

  return {
    problem,
    description: readme || "",
    code: code || "",
  };
}

function runProcess(command, args, options = {}) {
  const { input, timeout = EXEC_TIMEOUT_MS, cwd } = options;

  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd });
    let stdout = "";
    let stderr = "";
    let finished = false;

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill("SIGKILL");
      resolve({ stdout, stderr: `${stderr}\nTimed out.`, exitCode: null });
    }, timeout);

    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (exitCode) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode });
    });
  });
}

function needsMainFunction(source) {
  return !/\bint\s+main\s*\(/.test(source);
}

function hasInclude(source) {
  return /^\s*#include\s*</m.test(source);
}

function prepareCppSource(source) {
  let wrapped = source.trim();

  if (!hasInclude(wrapped)) {
    wrapped = [
      "#include <bits/stdc++.h>",
      "using namespace std;",
      "",
      wrapped,
    ].join("\n");
  }

  if (needsMainFunction(wrapped)) {
    wrapped = [wrapped, "", "int main() {", "  return 0;", "}", ""].join("\n");
  }

  return wrapped;
}

function applyFilters(problems, { search, topics, difficulty, sort }) {
  let filtered = [...problems];

  if (search) {
    const query = normalizeValue(search);
    filtered = filtered.filter((problem) => {
      const numberMatch = problem.number?.toString().includes(query);
      const titleMatch = normalizeValue(problem.title).includes(query);
      const slugMatch = normalizeValue(problem.slug).includes(query);
      return numberMatch || titleMatch || slugMatch;
    });
  }

  if (topics && topics.length) {
    const topicSet = new Set(topics.map((topic) => normalizeValue(topic)));
    filtered = filtered.filter((problem) => {
      const problemTopics = (problem.topics || []).map(normalizeValue);
      return problemTopics.some((topic) => topicSet.has(topic));
    });
  }

  if (difficulty && difficulty !== "all") {
    const desired = normalizeValue(difficulty);
    filtered = filtered.filter((problem) => {
      const normalized = normalizeValue(problem.difficulty);
      if (desired === "unspecified") {
        return !normalized || normalized === "unspecified";
      }
      return normalized === desired;
    });
  }

  if (sort) {
    const sortKey = sort.toLowerCase();
    const compareText = (a, b, key, asc = true) => {
      const left = normalizeValue(a[key]);
      const right = normalizeValue(b[key]);
      if (left === right) return 0;
      return asc ? left.localeCompare(right) : right.localeCompare(left);
    };

    filtered.sort((a, b) => {
      switch (sortKey) {
        case "number-desc":
          return (b.number || 0) - (a.number || 0);
        case "title-asc":
          return compareText(a, b, "title", true);
        case "title-desc":
          return compareText(a, b, "title", false);
        case "updated-desc":
          return compareText(a, b, "lastUpdated", false);
        case "updated-asc":
          return compareText(a, b, "lastUpdated", true);
        case "number-asc":
        default:
          return (a.number || 0) - (b.number || 0);
      }
    });
  }

  return filtered;
}

app.get("/api/problems", async (req, res) => {
  try {
    const { search, topics, difficulty, sort } = req.query;
    const topicList = topics ? topics.split(",").map((topic) => topic.trim()) : [];
    const problems = await getAllProblems();
    const filtered = applyFilters(problems, {
      search,
      topics: topicList,
      difficulty,
      sort,
    });

    res.json({ items: filtered, total: filtered.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to load problems." });
  }
});

app.get("/api/problem/:id", async (req, res) => {
  try {
    const detail = await getProblemDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ error: "Problem not found." });
    }
    res.json(detail);
  } catch (error) {
    res.status(500).json({ error: "Failed to load problem." });
  }
});

app.post("/api/problem/:id/run", async (req, res) => {
  try {
    const detail = await getProblemDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ error: "Problem not found." });
    }

    const rawCode = (req.body?.code || detail.code || "").toString();
    const input = (req.body?.input || "").toString();

    if (!rawCode.trim()) {
      return res.status(400).json({ error: "No code provided." });
    }
    if (rawCode.length > MAX_DETAIL_BYTES) {
      return res.status(400).json({ error: "Code is too large." });
    }

    const code = prepareCppSource(rawCode);

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "leetcode-"));
    const sourcePath = path.join(tempDir, "main.cpp");
    const outputPath = path.join(tempDir, "main.out");

    await fs.writeFile(sourcePath, code, "utf-8");

    const compile = await runProcess("g++", [
      "-std=c++17",
      "-O2",
      sourcePath,
      "-o",
      outputPath,
    ]);

    if (compile.exitCode !== 0) {
      await fs.rm(tempDir, { recursive: true, force: true });
      return res.json({
        compile,
        run: null,
      });
    }

    const run = await runProcess(outputPath, [], { input });
    await fs.rm(tempDir, { recursive: true, force: true });

    res.json({ compile, run });
  } catch (error) {
    res.status(500).json({ error: "Failed to execute code." });
  }
});

app.get("/api/topics", async (req, res) => {
  try {
    const problems = await getAllProblems();
    const topicSet = new Set();

    problems.forEach((problem) => {
      (problem.topics || []).forEach((topic) => topicSet.add(topic));
    });

    res.json({ items: Array.from(topicSet).sort() });
  } catch (error) {
    res.status(500).json({ error: "Failed to load topics." });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const problems = await getAllProblems();
    const byDifficulty = problems.reduce((acc, problem) => {
      const key = normalizeValue(problem.difficulty) || "unspecified";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const byTopic = problems.reduce((acc, problem) => {
      (problem.topics || []).forEach((topic) => {
        acc[topic] = (acc[topic] || 0) + 1;
      });
      return acc;
    }, {});

    res.json({
      total: problems.length,
      byDifficulty,
      byTopic,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load stats." });
  }
});

app.get("/api/gfg", async (req, res) => {
  try {
    const { search, topics, difficulty, sort } = req.query;
    const topicList = topics ? topics.split(",").map((t) => t.trim()) : [];
    const problems = await getAllGfgProblems();
    const filtered = applyFilters(problems, {
      search,
      topics: topicList,
      difficulty,
      sort,
    });
    res.json({ items: filtered, total: filtered.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to load GFG problems." });
  }
});

app.get("/api/gfg/:id", async (req, res) => {
  try {
    const detail = await getGfgProblemDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ error: "GFG problem not found." });
    }
    res.json(detail);
  } catch (error) {
    res.status(500).json({ error: "Failed to load GFG problem." });
  }
});

app.get("/api/gfg-stats", async (req, res) => {
  try {
    const problems = await getAllGfgProblems();
    const byDifficulty = problems.reduce((acc, problem) => {
      const key = normalizeValue(problem.difficulty) || "unspecified";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const byTopic = problems.reduce((acc, problem) => {
      (problem.topics || []).forEach((topic) => {
        acc[topic] = (acc[topic] || 0) + 1;
      });
      return acc;
    }, {});

    const byCompany = problems.reduce((acc, problem) => {
      (problem.companies || []).forEach((company) => {
        acc[company] = (acc[company] || 0) + 1;
      });
      return acc;
    }, {});

    res.json({
      total: problems.length,
      byDifficulty,
      byTopic,
      byCompany,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load GFG stats." });
  }
});

app.get("/api/dashboard-state", async (req, res) => {
  try {
    const document = await readDashboardState();
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: "Failed to load dashboard state." });
  }
});

app.post("/api/dashboard-state", async (req, res) => {
  try {
    const state = req.body?.state;
    if (!state || typeof state !== "object" || Array.isArray(state)) {
      return res.status(400).json({ error: "State must be an object." });
    }

    const document = await writeDashboardState(state);
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: "Failed to save dashboard state." });
  }
});

app.get("/api/keypoints/:problemId", async (req, res) => {
  try {
    if (!mongoReady || !KeyPointModel) {
      return res.json({ points: [] });
    }

    const keyPoint = await KeyPointModel.findOne(
      { problemId: req.params.problemId }
    ).lean();
    res.json({ points: keyPoint?.points || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to load key points." });
  }
});

app.post("/api/keypoints/:problemId", async (req, res) => {
  try {
    if (!mongoReady || !KeyPointModel) {
      return res.status(400).json({ error: "MongoDB is not configured." });
    }

    const { points } = req.body;
    if (!Array.isArray(points)) {
      return res.status(400).json({ error: "Points must be an array." });
    }

    const updated = await KeyPointModel.findOneAndUpdate(
      { problemId: req.params.problemId },
      { points },
      { upsert: true, new: true }
    );

    res.json({ points: updated.points });
  } catch (error) {
    res.status(500).json({ error: "Failed to save key points." });
  }
});

app.get("/api/problem-notes/:problemId", async (req, res) => {
  try {
    if (!mongoReady || !ProblemNotesModel) {
      return res.json({
        hints: [],
        algorithm: "",
        timeComplexity: "",
        spaceComplexity: "",
        edgeCases: [],
        codeSnippets: [],
        solutionNotes: "",
        relatedProblems: [],
        practiceCount: 0,
        lastPracticed: null,
        difficulty: "",
      });
    }

    const notes = await ProblemNotesModel.findOne(
      { problemId: req.params.problemId }
    ).lean();

    if (!notes) {
      return res.json({
        hints: [],
        algorithm: "",
        timeComplexity: "",
        spaceComplexity: "",
        edgeCases: [],
        codeSnippets: [],
        solutionNotes: "",
        relatedProblems: [],
        practiceCount: 0,
        lastPracticed: null,
        difficulty: "",
      });
    }

    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: "Failed to load problem notes." });
  }
});

app.post("/api/problem-notes/:problemId", async (req, res) => {
  try {
    if (!mongoReady || !ProblemNotesModel) {
      return res.status(400).json({ error: "MongoDB is not configured." });
    }

    const {
      hints,
      algorithm,
      timeComplexity,
      spaceComplexity,
      edgeCases,
      codeSnippets,
      solutionNotes,
      relatedProblems,
      difficulty,
    } = req.body;

    const updated = await ProblemNotesModel.findOneAndUpdate(
      { problemId: req.params.problemId },
      {
        hints: hints || [],
        algorithm: algorithm || "",
        timeComplexity: timeComplexity || "",
        spaceComplexity: spaceComplexity || "",
        edgeCases: edgeCases || [],
        codeSnippets: codeSnippets || [],
        solutionNotes: solutionNotes || "",
        relatedProblems: relatedProblems || [],
        difficulty: difficulty || "",
      },
      { upsert: true, new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to save problem notes." });
  }
});

app.post("/api/problem-notes/:problemId/practice", async (req, res) => {
  try {
    if (!mongoReady || !ProblemNotesModel) {
      return res.status(400).json({ error: "MongoDB is not configured." });
    }

    const updated = await ProblemNotesModel.findOneAndUpdate(
      { problemId: req.params.problemId },
      {
        $inc: { practiceCount: 1 },
        lastPracticed: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      practiceCount: updated.practiceCount,
      lastPracticed: updated.lastPracticed,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update practice count." });
  }
});

app.post("/api/seed", async (req, res) => {
  if (!mongoReady || !ProblemModel) {
    return res.status(400).json({ error: "MongoDB is not configured." });
  }

  try {
    const problems = await loadJsonProblems();
    const operations = problems.map((problem) => ({
      updateOne: {
        filter: { number: problem.number },
        update: { $set: problem },
        upsert: true,
      },
    }));

    await ProblemModel.bulkWrite(operations);
    res.json({ message: "Seed completed.", count: problems.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to seed MongoDB." });
  }
});

app.post("/api/refresh", async (req, res) => {
  try {
    cacheReady = false;
    cachedProblems = [];
    await refreshCache("manual-refresh");
    res.json({ message: "Refreshed.", count: cachedProblems.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to refresh." });
  }
});

const PORT = Number(process.env.PORT) || 4000;
connectMongo().finally(() => {
  Promise.all([
    loadJsonProblems().catch(() => []),
    loadGfgProblems().catch(() => []),
  ])
    .then(([problems, gfgProblems]) => {
      cachedProblems = problems;
      cachedGfgProblems = gfgProblems;
      cacheReady = true;
      gfgCacheReady = true;
    })
    .catch((error) => {
      console.warn("Failed to preload problems cache:", error.message);
      cachedProblems = [];
      cachedGfgProblems = [];
      cacheReady = true;
      gfgCacheReady = true;
    })
    .finally(() => {
      startWatcher();
      app.listen(PORT, () => {
        console.log(`API running on http://localhost:${PORT}`);
        if (GITHUB_REPO) {
          console.log(`Fetching problems from GitHub: ${GITHUB_REPO}`);
        }
      });

      refreshCache("startup").catch((error) => {
        console.warn("Initial cache refresh failed:", error.message);
      });

      if (GITHUB_REPO) {
        setInterval(() => {
          refreshCache("github-periodic").catch((error) => {
            console.warn("Periodic GitHub refresh failed:", error.message);
          });
        }, 5 * 60 * 1000);
      }
    });
});
