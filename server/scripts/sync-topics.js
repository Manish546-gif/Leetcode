import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const DATA_PATH = path.join(ROOT_DIR, "server", "data", "problems.json");
const README_PATH = path.join(ROOT_DIR, "README.md");

async function main() {
  const readme = await fs.readFile(README_PATH, "utf-8");
  const problemsRaw = await fs.readFile(DATA_PATH, "utf-8");
  const problems = JSON.parse(problemsRaw);

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

  let updated = 0;
  for (const problem of problems) {
    const topics = topicMap[problem.id] || [];
    if (topics.length > 0 && JSON.stringify(problem.topics) !== JSON.stringify(topics)) {
      problem.topics = topics;
      updated++;
    }
  }

  await fs.writeFile(DATA_PATH, JSON.stringify(problems, null, 2) + "\n");
  console.log(`Updated topics for ${updated} problems.`);
}

main().catch((error) => {
  console.error("Failed to sync topics:", error.message);
  process.exit(1);
});
