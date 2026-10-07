import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { randomUUID } from "crypto";
import AdmZip from "adm-zip";
import pool from "../database/db.js";
import crypto from "crypto";
import { generateSourceFingerprint } from "../utils/sourceFingerprint.js";
import { analyzeCodeFile} from "../services/aiAnalysisService.js";
import { generateAIRepair } from "../services/aiRepairService.js";

const CODE_EXTENSIONS = new Set([".js",".jsx",".ts",".tsx",".py",".java",".cs",".go",".rb",".php",".json",".md"]);
const IGNORED_DIRECTORIES = new Set(["node_modules",".git","dist","build"]);

export const uploadProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Get GitHub URL and remove extra spaces
    const github_url = req.body.github_url?.trim() || null;

    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "Project name and description are required",
      });
    }

    // User must provide either ZIP or GitHub
    if (!github_url && !req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a ZIP file or provide a GitHub URL.",
      });
    }

    // User cannot provide both
    if (github_url && req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload either a ZIP file or a GitHub URL, not both.",
      });
    }

    // Normalize GitHub URL
    const normalizedGithubUrl = github_url
      ? github_url.replace(/\/+$/, "")
      : null;
    // =====================================================
    // CREATE NEW PROJECT ID
    // =====================================================

    const projectId = randomUUID();

    // Create project upload directory
    const uploadDir = getProjectDirectory(projectId);

    fs.mkdirSync(uploadDir, { recursive: true });

    // =====================================================
    // HANDLE ZIP FILE
    // =====================================================
let zipPath = null;
let zipHash = null;
let sourceFingerprint = null;

if (req.file) {
  zipPath = path.join(uploadDir, "project.zip");

  // Calculate SHA-256 hash of the uploaded ZIP
  zipHash = crypto
    .createHash("sha256")
    .update(req.file.buffer)
    .digest("hex");

  // Save ZIP file
  fs.writeFileSync(zipPath, req.file.buffer);

  // Extract ZIP for source fingerprint generation
  const extractDir = path.join(uploadDir, "source");

  fs.mkdirSync(extractDir, { recursive: true });

  const zip = new AdmZip(req.file.buffer);

  zip.extractAllTo(extractDir, true);

  // Generate fingerprint from the actual source files
  sourceFingerprint = generateSourceFingerprint(extractDir);

  console.log("SOURCE FINGERPRINT:", sourceFingerprint);
}

if (normalizedGithubUrl) {
  const sourceDir = path.join(uploadDir, "source");

  fs.mkdirSync(sourceDir, {
    recursive: true,
  });

  console.log(
    "Cloning GitHub repository:",
    normalizedGithubUrl
  );

  await cloneGitHubRepository(
    normalizedGithubUrl,
    sourceDir
  );

  sourceFingerprint =
    generateSourceFingerprint(sourceDir);

  console.log(
    "GITHUB SOURCE FINGERPRINT:",
    sourceFingerprint
  );
}

// Prevent duplicate ZIP files
if (zipHash) {
  const existingZip = await pool.query(
    `
    SELECT id, name, github_url, zip_file
    FROM projects
    WHERE user_id = $1
      AND zip_hash = $2
    LIMIT 1
    `,
    [req.user.id, zipHash]
  );

  if (existingZip.rows.length > 0) {
    return res.status(409).json({
      success: false,
      message: "This ZIP project has already been uploaded.",
      project: existingZip.rows[0],
    });
  }
}

// =====================================================
// Prevent duplicate SOURCE CODE
// Works for ZIP <-> ZIP, GitHub <-> GitHub,
// and ZIP <-> GitHub
// =====================================================

if (sourceFingerprint) {
  const existingSource = await pool.query(
    `
    SELECT
      id,
      name,
      github_url,
      zip_file,
      source_fingerprint
    FROM projects
    WHERE source_fingerprint = $1
    LIMIT 1
    `,
    [sourceFingerprint]
  );

   if (existingSource.rows.length > 0) {
  try {
    fs.rmSync(uploadDir, {
      recursive: true,
      force: true,
    });
  } catch (cleanupError) {
    console.warn(
      "Duplicate project detected, but temporary cleanup failed:",
      cleanupError.message
    );
  }

  return res.status(409).json({
    success: false,
    message:
      "This project has already been uploaded. The source code matches an existing project.",
    project: existingSource.rows[0],
  });
}
}
    // =====================================================
    // INSERT PROJECT
    // =====================================================

    const result = await pool.query(
  `
  INSERT INTO projects (
    id,
    name,
    description,
    user_id,
    github_url,
    zip_file,
    zip_hash,
    source_fingerprint,
    scan_status
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  RETURNING *
  `,
  [
    projectId,
    name,
    description,
    req.user.id,
    normalizedGithubUrl,
    zipPath,
    zipHash,
    sourceFingerprint,
    "Uploaded",
  ]
);
    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================

    return res.status(201).json({
      success: true,
      message: "Project uploaded successfully",
      project: result.rows[0],
    });
  } catch (error) {
    console.error("UPLOAD PROJECT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const scanProject = async (req,res) => {
  try {
    const { id } = req.params;
    const projectResult = await pool.query(
  `
  SELECT p.*
  FROM projects p
  LEFT JOIN project_members pm
    ON p.id = pm.project_id
  WHERE p.id = $1
    AND (
      p.user_id = $2
      OR pm.user_id = $2
    )
  LIMIT 1
  `,
  [id, req.user.id]
);
    if (!projectResult.rows.length) return res.status(404).json({ success:false,message:"Project not found" });

    await pool.query(
      "UPDATE projects SET scan_status=$1,updated_at=NOW() WHERE id=$2",
      ["Scanning",id]
    );

    const projectDir = await ensureProjectFiles(id);
    const files = collectSourceFiles(projectDir);
    if (!files.length) throw new Error("No project source files were found to scan.");

    await pool.query("DELETE FROM ai_bugs WHERE project_id=$1 AND status!='Resolved'",[id]);

    const bugs = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(file,"utf8");
        const relativePath = path.relative(projectDir,file).replace(/\\/g,"/");
        const analyses = analyzeCodeFile(relativePath,content);

        if (!Array.isArray(analyses) || !analyses.length) continue;

        for (const analysis of analyses) {
          if (!analysis) continue;

          const bugId = randomUUID();
          await pool.query(
            `INSERT INTO ai_bugs
            (id,project_id,file_name,source_file_path,line_number,bug_title,bug_description,
            severity,suggested_fix,ai_response,source_code_snippet,old_code,new_code,
            generated_patch,ai_explanation,confidence,fix_status,status,created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
            [
              bugId,
              id,
              relativePath,
              relativePath,
              analysis.line_number,
              analysis.bug_title,
              analysis.bug_description,
              analysis.severity,
              analysis.suggested_fix,
              analysis.ai_response,
              analysis.old_code,
              analysis.old_code,
              analysis.new_code,
              analysis.generated_patch,
              analysis.ai_explanation,
              analysis.confidence,
              "Open",
              "Open",
              new Date()
            ]
          );
          bugs.push({
            id:bugId,
            file_name:relativePath,
            line_number:analysis.line_number,
            bug_title:analysis.bug_title,
            severity:analysis.severity
          });
        }
      } catch (fileError) {
        console.error(`FILE SCAN ERROR: ${file}`,fileError.message);
      }
    }

    await pool.query(
      "UPDATE projects SET scan_status=$1,updated_at=NOW() WHERE id=$2",
      ["Scanned",id]
    );

    return res.status(200).json({
      success:true,
      message:bugs.length ? "Project scanned successfully" : "No Bugs Found",
      filesScanned:files.length,
      bugsFound:bugs.length,
      bugs
    });
  } catch (error) {
    console.error("SCAN PROJECT ERROR:",error);
    try {
      await pool.query(
        "UPDATE projects SET scan_status=$1,updated_at=NOW() WHERE id=$2",
        ["Failed",req.params.id]
      );
    } catch (updateError) {
      console.error("SCAN STATUS UPDATE ERROR:",updateError.message);
    }
    return res.status(500).json({ success:false,message:error.message });
  }
};
export const getProjectBugs = async (req, res) => {
  try {
    const { id } = req.params;

    const projectResult = await pool.query(
      `
      SELECT p.id
      FROM projects p
      LEFT JOIN project_members pm
        ON p.id = pm.project_id
      WHERE p.id = $1
        AND (
          p.user_id = $2
          OR pm.user_id = $2
        )
      LIMIT 1
      `,
      [id, req.user.id]
    );

    if (!projectResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied"
      });
    }

    const result = await pool.query(
      `SELECT * FROM ai_bugs
       WHERE project_id = $1
       AND status NOT IN ('Resolved')
       ORDER BY created_at DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      bugs: result.rows,
      count: result.rows.length,
      message: result.rows.length
        ? "Bugs found"
        : "No Bugs Found"
    });

  } catch (error) {
    console.error("GET PROJECT BUGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const analyzeBug = async (req,res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT b.*,p.user_id
       FROM ai_bugs b
       INNER JOIN projects p ON p.id=b.project_id
       WHERE b.id=$1`,
      [id]
    );

    if (!result.rows.length) return res.status(404).json({ success:false,message:"Bug not found" });
    const bug = result.rows[0];

    const accessResult = await pool.query(
  `
  SELECT p.id
  FROM projects p
  LEFT JOIN project_members pm
    ON p.id = pm.project_id
  WHERE p.id = $1
    AND (
      p.user_id = $2
      OR pm.user_id = $2
    )
  LIMIT 1
  `,
  [bug.project_id, req.user.id]
);

if (!accessResult.rows.length) {
  return res.status(403).json({
    success: false,
    message: "Access denied"
  });

    }

    const projectDir = await ensureProjectFiles(bug.project_id);
    const sourceFilePath = resolveSafeProjectFile(projectDir,bug.source_file_path || bug.file_name);
    const sourceContent = fs.readFileSync(sourceFilePath,"utf8");
    const oldCode = readRelevantCode(
      sourceContent,
      bug.line_number || 1,
      bug.source_code_snippet || bug.old_code || ""
    );

    return res.status(200).json({
      success:true,
      analysis:{
        bugId:bug.id,
        fileName:bug.source_file_path || bug.file_name,
        lineNumber:bug.line_number || 1,
        bugTitle:bug.bug_title,
        description:bug.bug_description,
        severity:bug.severity,
        oldCode,
        explanation:bug.ai_explanation || bug.ai_response || bug.suggested_fix
      }
    });
  } catch (error) {
    console.error("ANALYZE BUG ERROR:",error);
    return res.status(500).json({ success:false,message:error.message });
  }
};

export const fixBug = async (req,res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT b.*,p.user_id
       FROM ai_bugs b
       INNER JOIN projects p ON p.id=b.project_id
       WHERE b.id=$1`,
      [id]
    );

    if (!result.rows.length) return res.status(404).json({ success:false,message:"Bug not found" });
    const bug = result.rows[0];

   const accessResult = await pool.query(
  `
  SELECT p.id
  FROM projects p
  LEFT JOIN project_members pm
    ON p.id = pm.project_id
  WHERE p.id = $1
    AND (
      p.user_id = $2
      OR pm.user_id = $2
    )
  LIMIT 1
  `,
  [bug.project_id, req.user.id]
);

if (!accessResult.rows.length) {
  return res.status(403).json({
    success: false,
    message: "Access denied"
  });
}

    const projectDir = await ensureProjectFiles(bug.project_id);
    const sourceFilePath = resolveSafeProjectFile(projectDir,bug.source_file_path || bug.file_name);
    const sourceContent = fs.readFileSync(sourceFilePath,"utf8");
    const oldCode = readRelevantCode(
      sourceContent,
      bug.line_number || 1,
      bug.source_code_snippet || bug.old_code || ""
    );

    const repair = await generateAIRepair({
  bugTitle: bug.bug_title,
  fileName: bug.source_file_path || bug.file_name,
  sourceCode: sourceContent,
  oldCode
});


    if (!repair || !repair.canApply || !repair.newCode || normalizeCode(repair.oldCode) === normalizeCode(repair.newCode)) {
      return res.status(400).json({
        success:false,
        message:"No safe automatic fix was generated for this issue."
      });
    }

    await pool.query(
      `UPDATE ai_bugs
       SET status=$1,fix_status=$2,old_code=$3,new_code=$4,
       generated_patch=$5,ai_explanation=$6,confidence=$7
       WHERE id=$8`,
      [
        "Fix Generated",
        "Fix Generated",
        repair.oldCode || oldCode,
        repair.newCode,
        repair.generatedPatch,
        repair.explanation,
        repair.confidence,
        id
      ]
    );

    return res.status(200).json({
      success:true,
      fix:{
        bugId:bug.id,
        fileName:bug.source_file_path || bug.file_name,
        lineNumber:bug.line_number || 1,
        oldCode:repair.oldCode || oldCode,
        newCode:repair.newCode,
        explanation:repair.explanation,
        confidence:repair.confidence
      }
    });
  } catch (error) {
    console.error("FIX BUG ERROR:",error);
    return res.status(500).json({ success:false,message:error.message });
  }
};

export const applyFix = async (req,res) => {
  try {
    const { id } = req.params;
    const { oldCode,newCode } = req.body || {};

    const result = await pool.query(
      `SELECT b.*,p.user_id
       FROM ai_bugs b
       INNER JOIN projects p ON p.id=b.project_id
       WHERE b.id=$1`,
      [id]
    );

    if (!result.rows.length) return res.status(404).json({ success:false,message:"Bug not found" });
    const bug = result.rows[0];

    if (bug.user_id !== req.user.id) {
      return res.status(403).json({ success:false,message:"Access denied" });
    }

    const projectDir = await ensureProjectFiles(bug.project_id);
    const sourceFilePath = resolveSafeProjectFile(projectDir,bug.source_file_path || bug.file_name);
    const currentContent = fs.readFileSync(sourceFilePath,"utf8");

    const sourceOldCode = (oldCode || bug.old_code || bug.source_code_snippet || "").trim();
    const sourceNewCode = (newCode || bug.new_code || "").trim();

    if (!sourceOldCode || !sourceNewCode || normalizeCode(sourceOldCode) === normalizeCode(sourceNewCode)) {
      return res.status(400).json({
        success:false,
        message:"A generated fix is required before applying it."
      });
    }

    if (!currentContent.includes(sourceOldCode)) {
      return res.status(409).json({
        success:false,
        message:"The source code has changed. Please generate the fix again."
      });
    }

    const backupPath = createBackupPath(sourceFilePath);
    fs.copyFileSync(sourceFilePath,backupPath);

    const updatedContent = currentContent.replace(sourceOldCode,sourceNewCode);
    if (updatedContent === currentContent || !updatedContent.includes(sourceNewCode)) {
      return res.status(400).json({ success:false,message:"The generated replacement was not applied to the source file." });
    }
    fs.writeFileSync(sourceFilePath,updatedContent,"utf8");

    await pool.query(
      `UPDATE ai_bugs
       SET status=$1,fix_status=$2,old_code=$3,new_code=$4
       WHERE id=$5`,
      ["Fix Applied","Fix Applied",sourceOldCode,sourceNewCode,id]
    );

    await revalidateProjectBugs(
  bug.project_id,
  projectDir
);

    return res.status(200).json({
      success:true,
      message:"Fix applied successfully",
      backupPath:path.relative(projectDir,backupPath).replace(/\\/g,"/")
    });
  } catch (error) {
    console.error("APPLY FIX ERROR:",error);
    return res.status(500).json({ success:false,message:error.message });
  }
};

export const buildProject = async (req,res) => {
  try {
    const { id } = req.params;
    const projectResult = await pool.query(
  `
  SELECT p.*
  FROM projects p
  LEFT JOIN project_members pm
    ON p.id = pm.project_id
  WHERE p.id = $1
    AND (
      p.user_id = $2
      OR pm.user_id = $2
    )
  LIMIT 1
  `,
  [id, req.user.id]
);

if (!projectResult.rows.length) {
  return res.status(404).json({
    success: false,
    message: "Project not found or access denied"
  });
}

    const projectDir = await ensureProjectFiles(id);
    const projectPackage = path.join(projectDir,"package.json");

    let buildSummary = {
      success:true,
      exitCode:0,
      stdout:"No build script was found for this project.",
      stderr:"",
      buildStatus:"Passed"
    };

    if (fs.existsSync(projectPackage)) {
      buildSummary = await runBuildValidation(projectDir);
    }

    if (!buildSummary.success) {
      await pool.query(
        "UPDATE projects SET scan_status=$1,updated_at=NOW() WHERE id=$2",
        ["Failed",id]
      );
      await pool.query(
        "UPDATE ai_bugs SET status=$1,fix_status=$2 WHERE project_id=$3 AND status='Fix Applied'",
        ["Fix Failed","Fix Failed",id]
      );

      return res.status(200).json({
        success:false,
        message:"Build failed",
        buildStatus:"Failed",
        details:buildSummary
      });
    }

    const files = await revalidateProjectBugs(id,projectDir);

    const activeBugsResult = await pool.query(
      "SELECT COUNT(*) as count FROM ai_bugs WHERE project_id=$1 AND status!='Resolved'",
      [id]
    );
    const activeBugCount = parseInt(activeBugsResult.rows[0].count, 10);

    const finalStatus = activeBugCount === 0 ? "Passed" : "Scanned";

    await pool.query(
      "UPDATE projects SET scan_status=$1,updated_at=NOW() WHERE id=$2",
      [finalStatus, id]
    );

    return res.status(200).json({
      success: true,
      message: activeBugCount === 0 ? "Build successful. No bugs found." : "Build successful, but bugs still exist.",
      buildStatus: "Passed",
      filesScanned: files.length,
      bugsFound: activeBugCount,
      details: buildSummary
    });
  } catch (error) {
    console.error("BUILD PROJECT ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadRepairedProject = async (req, res) => {
  try {
    const { id } = req.params;

    const projectResult = await pool.query(
      `
      SELECT p.*
      FROM projects p
      LEFT JOIN project_members pm
        ON p.id = pm.project_id
      WHERE p.id = $1
        AND (
          p.user_id = $2
          OR pm.user_id = $2
        )
      LIMIT 1
      `,
      [id, req.user.id]
    );

    if (!projectResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied",
      });
    }

    const projectDir = await ensureProjectFiles(id);

    const repairedZipPath = createRepairedZip(
      projectDir,
      id
    );

    return res.download(
      repairedZipPath,
      `repaired-project-${id}.zip`,
      error => {
        if (error) {
          console.error(
            "REPAIRED ZIP DOWNLOAD ERROR:",
            error
          );
        }
      }
    );
  } catch (error) {
    console.error(
      "DOWNLOAD REPAIRED PROJECT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getProjectDirectory = projectId =>
  path.join(process.cwd(),"uploads","projects",projectId);

const createRepairedZip = (projectDir, projectId) => {
  const zip = new AdmZip();

  const addDirectory = (directory, zipPath = "") => {
    const entries = fs.readdirSync(directory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (
        entry.name.endsWith(".bak") ||
        entry.name.startsWith("repaired-project") ||
        entry.name === "project.zip"
      ) {
        continue;
      }

      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        addDirectory(
          fullPath,
          zipPath
            ? `${zipPath}/${entry.name}`
            : entry.name
        );
      } else {
        zip.addLocalFile(
          fullPath,
          zipPath
        );
      }
    }
  };

  addDirectory(projectDir);

  const repairedZipName =
    `repaired-project-${projectId}.zip`;

  const repairedZipPath = path.join(
    projectDir,
    repairedZipName
  );

  zip.writeZip(repairedZipPath);

  return repairedZipPath;
};

const normalizeCode = code => (code || "").replace(/\s+/g," ").trim();

const revalidateProjectBugs = async (projectId,projectDir) => {
  const files = collectSourceFiles(projectDir);
  if (!files.length) throw new Error("No project source files were found to validate.");
  const currentKeys = new Set();
  for (const file of files) {
    const content = fs.readFileSync(file,"utf8");
    const relativePath = path.relative(projectDir,file).replace(/\\/g,"/");
    const analyses = analyzeCodeFile(relativePath,content);
    for (const analysis of analyses) {
      const key = `${relativePath}::${analysis.bug_title}`;
      currentKeys.add(key);
      const existing = await pool.query(
        "SELECT id,status FROM ai_bugs WHERE project_id=$1 AND file_name=$2 AND bug_title=$3 AND status!='Resolved' ORDER BY created_at DESC LIMIT 1",
        [projectId,relativePath,analysis.bug_title]
      );
      if (!existing.rows.length) {
        await insertBug(projectId,relativePath,analysis);
      } else if (existing.rows[0].status === "Fix Applied") {
        await pool.query("UPDATE ai_bugs SET status=$1,fix_status=$2,line_number=$3,source_code_snippet=$4 WHERE id=$5",["Fix Failed","Fix Failed",analysis.line_number,analysis.source_code_snippet,existing.rows[0].id]);
      }
    }
  }
  const fixed = await pool.query("SELECT id,file_name,bug_title FROM ai_bugs WHERE project_id=$1 AND status='Fix Applied'",[projectId]);
  for (const bug of fixed.rows) {
    if (!currentKeys.has(`${bug.file_name}::${bug.bug_title}`)) {
      await pool.query("UPDATE ai_bugs SET status=$1,fix_status=$2 WHERE id=$3",["Resolved","Resolved",bug.id]);
    }
  }
  return files;
};

const insertBug = async (projectId,fileName,analysis) => {
  const bugId = randomUUID();
  await pool.query(
    `INSERT INTO ai_bugs
    (id,project_id,file_name,source_file_path,line_number,bug_title,bug_description,
    severity,suggested_fix,ai_response,source_code_snippet,old_code,new_code,
    generated_patch,ai_explanation,confidence,fix_status,status,created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
    [bugId,projectId,fileName,fileName,analysis.line_number,analysis.bug_title,analysis.bug_description,analysis.severity,analysis.suggested_fix,analysis.ai_response,analysis.source_code_snippet || analysis.old_code,analysis.old_code,analysis.new_code,analysis.generated_patch,analysis.ai_explanation,analysis.confidence,"Open","Open",new Date()]
  );
  return bugId;
};

const ensureProjectFiles = async projectId => {
  const projectDir = getProjectDirectory(projectId);
  fs.mkdirSync(projectDir,{ recursive:true });

  const projectResult = await pool.query(
    "SELECT zip_file,github_url FROM projects WHERE id=$1",
    [projectId]
  );

  if (!projectResult.rows.length) {
    throw new Error("Project not found.");
  }

  const { zip_file:zipFilePath,github_url:githubUrl } = projectResult.rows[0];

  const sourceFiles = collectSourceFiles(projectDir);

  if (sourceFiles.length) return projectDir;

  if (zipFilePath && fs.existsSync(zipFilePath)) {
    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(projectDir,true);
    if (collectSourceFiles(projectDir).length) return projectDir;
    throw new Error("The uploaded ZIP contains no supported project source files.");
  }

  if (githubUrl) {
    await cloneGitHubRepository(githubUrl,projectDir);
    if (collectSourceFiles(projectDir).length) return projectDir;
    throw new Error("The downloaded GitHub repository contains no supported project source files.");
  }

  throw new Error("No project source files are available for scanning.");
};

export const cloneGitHubRepository = (githubUrl,projectDir) =>
  new Promise((resolve,reject) => {
    const command = process.platform === "win32" ? "git.exe" : "git";
    execFile(
      command,
      ["clone","--depth","1",githubUrl,projectDir],
      { timeout:120000 },
      error => {
        if (error) return reject(new Error(`GitHub repository could not be downloaded: ${error.message}`));
        resolve();
      }
    );
  });

const resolveSafeProjectFile = (projectDir,requestedPath) => {
  const baseDir = path.resolve(projectDir);

  if (!requestedPath || typeof requestedPath !== "string") {
    throw new Error("A valid file path is required.");
  }

  const trimmedPath = requestedPath.trim();

  if (!trimmedPath) {
    throw new Error("A valid file path is required.");
  }

  if (
    trimmedPath.startsWith("/") ||
    trimmedPath.startsWith("\\") ||
    /^[A-Za-z]:[\\/]/.test(trimmedPath)
  ) {
    throw new Error("Absolute paths are not allowed.");
  }

  const candidatePath = path.resolve(baseDir,trimmedPath);
  const relativePath = path.relative(baseDir,candidatePath);

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath) ||
    (!candidatePath.startsWith(baseDir + path.sep) && candidatePath !== baseDir)
  ) {
    throw new Error("The supplied path resolves outside the project directory.");
  }

  if (!fs.existsSync(candidatePath) || !fs.statSync(candidatePath).isFile()) {
    throw new Error("The requested source file could not be found.");
  }

  return candidatePath;
};

const readRelevantCode = (content,lineNumber,fallbackSnippet="") => {
  const lines = content.split(/\r?\n/);
  const requestedLine = Number.isFinite(Number(lineNumber))
    ? Math.max(1,Number(lineNumber))
    : 1;

  return lines[requestedLine - 1] !== undefined
    ? lines[requestedLine - 1].trim()
    : fallbackSnippet || "";
};

const createBackupPath = filePath => {
  const directory = path.dirname(filePath);
  const extension = path.extname(filePath);
  const baseName = path.basename(filePath,extension);

  let candidatePath = path.join(directory,`${baseName}${extension}.bak`);
  let suffix = 1;

  while (fs.existsSync(candidatePath)) {
    candidatePath = path.join(
      directory,
      `${baseName}${extension}.bak.${suffix}`
    );
    suffix++;
  }

  return candidatePath;
};

const runBuildValidation = projectDir =>
  new Promise(resolve => {
    const command = process.platform === "win32" ? "npm.cmd" : "npm";

    execFile(
      command,
      ["run","build"],
      { cwd:projectDir,timeout:120000 },
      (error,stdout,stderr) => {
        const success = !error;

        resolve({
          success,
          exitCode:error ? error.code || 1 : 0,
          stdout,
          stderr,
          buildStatus:success ? "Passed" : "Failed"
        });
      }
    );
  });

const collectSourceFiles = rootDir => {
  const files = [];

  if (!fs.existsSync(rootDir)) return files;

  const entries = fs.readdirSync(rootDir,{ withFileTypes:true });

  for (const entry of entries) {
    const fullPath = path.join(rootDir,entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        files.push(...collectSourceFiles(fullPath));
      }
    } else if (
      entry.isFile() &&
      CODE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) &&
      !entry.name.endsWith(".bak")
    ) {
      files.push(fullPath);
    }
  }

  return files;
};