import fs from "fs";
import path from "path";
import crypto from "crypto";

const ALLOWED_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".cs",
  ".go",
  ".rb",
  ".php",
  ".json",
  ".md",
  ".html",
  ".css",
]);

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
]);

const getFiles = (directory, rootDirectory = directory) => {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      files.push(...getFiles(fullPath, rootDirectory));
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      continue;
    }

    const relativePath = path
      .relative(rootDirectory, fullPath)
      .split(path.sep)
      .join("/");

    files.push({
      relativePath,
      fullPath,
    });
  }

  return files;
};

export const generateSourceFingerprint = (projectDirectory) => {
  const files = getFiles(projectDirectory);

  files.sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath)
  );

  const fileData = files.map((file) => {
    const content = fs.readFileSync(file.fullPath, "utf8");

    const normalizedContent = content.replace(/\r\n/g, "\n");

    const fileHash = crypto
      .createHash("sha256")
      .update(normalizedContent)
      .digest("hex");

    return `${file.relativePath}:${fileHash}`;
  });

  const fingerprint = crypto
    .createHash("sha256")
    .update(fileData.join("\n"))
    .digest("hex");

  return fingerprint;
};