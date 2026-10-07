import fs from "fs";
import path from "path";

import pool from "./database/db.js";

import {
  cloneGitHubRepository,
} from "./controllers/aiProjectController.js";

import {
  generateSourceFingerprint,
} from "./utils/sourceFingerprint.js";


const getProjectDirectory = (projectId) => {
  return path.join(
    process.cwd(),
    "uploads",
    "projects",
    projectId
  );
};


const backfillGithubFingerprints = async () => {
  try {

    // Get existing GitHub projects
    // which don't have fingerprints yet
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        github_url
      FROM projects
      WHERE github_url IS NOT NULL
        AND source_fingerprint IS NULL
      ORDER BY created_at
      `
    );

    console.log(
      `Found ${result.rows.length} GitHub projects to process.`
    );


    for (const project of result.rows) {

      console.log("\n====================================");
      console.log("Project:", project.name);
      console.log("GitHub:", project.github_url);


      const projectDir =
        getProjectDirectory(project.id);

      const sourceDir =
        path.join(projectDir, "source");


      try {

        // Remove old source folder if it exists
        if (fs.existsSync(sourceDir)) {
          fs.rmSync(sourceDir, {
            recursive: true,
            force: true,
          });
        }


        // Create source directory
        fs.mkdirSync(sourceDir, {
          recursive: true,
        });


        // Clone GitHub repository
        console.log("Cloning repository...");

        await cloneGitHubRepository(
          project.github_url,
          sourceDir
        );


        console.log(
          "Repository cloned successfully."
        );


        // Generate source fingerprint
        const fingerprint =
          generateSourceFingerprint(sourceDir);


        console.log(
          "Fingerprint:",
          fingerprint
        );


        // Save fingerprint
        await pool.query(
          `
          UPDATE projects
          SET
            source_fingerprint = $1,
            updated_at = NOW()
          WHERE id = $2
          `,
          [
            fingerprint,
            project.id,
          ]
        );


        console.log(
          "Fingerprint saved successfully."
        );

      } catch (projectError) {

        console.error(
          "Failed:",
          projectError.message
        );

      }
    }


    console.log("\n====================================");
    console.log(
      "GitHub fingerprint backfill completed."
    );


  } catch (error) {

    console.error(
      "BACKFILL ERROR:",
      error
    );

  } finally {

    await pool.end();

  }
};


backfillGithubFingerprints();