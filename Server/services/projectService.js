import pool from "../database/db.js";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { ensureProjectOwnerMembership } from "./memberService.js";

export const createProject=async(projectData,userId)=>{
  const {name,description}=projectData;
  const query=`
    INSERT INTO projects (id,name,description,user_id)
    VALUES ($1,$2,$3,$4)
    RETURNING *;
  `;
  const values=[randomUUID(),name,description,userId];
  const result=await pool.query(query,values);
  const project=result.rows[0];
  await ensureProjectOwnerMembership(project.id,userId);
  return project;
};

export const getProjects = async (userId) => {
  const result = await pool.query(
    `
    SELECT DISTINCT p.*
    FROM projects p
    LEFT JOIN project_members pm
      ON p.id = pm.project_id
    WHERE p.user_id = $1
       OR pm.user_id = $1
    ORDER BY p.created_at DESC
    `,
    [userId]
  );

  return result.rows;
};

export const updateProject=async(projectId,userId,projectData)=>{
  const {name,description}=projectData;
  const result=await pool.query(
    `
    UPDATE projects
    SET name=$1,
        description=$2,
        updated_at=NOW()
    WHERE id=$3
      AND user_id=$4
    RETURNING *;
    `,
    [name,description,projectId,userId]
  );
  return result.rows[0];
};

export const deleteProject = async (projectId, userId) => {
  const result = await pool.query(
    `
    DELETE FROM projects
    WHERE id=$1
      AND user_id=$2
    RETURNING *;
    `,
    [projectId, userId]
  );

  const deletedProject = result.rows[0];

  if (!deletedProject) {
    return null;
  }

  // Delete uploaded project files
  const projectDirectory = path.join(
    process.cwd(),
    "uploads",
    "projects",
    projectId
  );

  try {
    if (fs.existsSync(projectDirectory)) {
      fs.rmSync(projectDirectory, {
        recursive: true,
        force: true,
      });

      console.log(
        `Deleted project files: ${projectDirectory}`
      );
    }
  } catch (error) {
    console.error(
      "Project deleted from database, but file cleanup failed:",
      error.message
    );
  }

  return deletedProject;
};

export const getProjectById = async (projectId, userId) => {
  const result = await pool.query(
    `
    SELECT DISTINCT p.*
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
    [projectId, userId]
  );

  return result.rows[0];
};