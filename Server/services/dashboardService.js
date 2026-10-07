import pool from "../database/db.js";

const ensureProjectOwner = async (projectId, userId) => {
  const result = await pool.query(
    `SELECT id FROM projects WHERE id = $1 AND user_id = $2`,
    [projectId, userId]
  );

  if (result.rowCount === 0) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }
};
export const getDashboardStats = async (userId) => {
  const totalProjects=await pool.query(
  `SELECT COUNT(*) FROM (
    SELECT DISTINCT github_url AS project_key
    FROM projects
    WHERE user_id=$1 AND github_url IS NOT NULL
    UNION
    SELECT DISTINCT COALESCE(zip_file,name) AS project_key
    FROM projects
    WHERE user_id=$1 AND github_url IS NULL
  ) AS unique_projects`,
  [userId]
);

  const totalBugs=await pool.query(
  `SELECT COUNT(*)
   FROM ai_bugs ab
   JOIN projects p ON p.id=ab.project_id
   WHERE p.user_id=$1
   AND ab.status!='Resolved'`,
  [userId]
);

  const openBugs = await pool.query(
    `SELECT COUNT(*)
     FROM ai_bugs ab
     JOIN projects p ON p.id=ab.project_id
     WHERE p.user_id=$1 AND ab.status='Open'`,
    [userId]
  );

  const inProgressBugs = await pool.query(
    `SELECT COUNT(*)
     FROM ai_bugs ab
     JOIN projects p ON p.id=ab.project_id
     WHERE p.user_id=$1 AND ab.status='In Progress'`,
    [userId]
  );

  const resolvedBugs = await pool.query(
    `SELECT COUNT(*)
     FROM ai_bugs ab
     JOIN projects p ON p.id=ab.project_id
     WHERE p.user_id=$1 AND ab.status='Resolved'`,
    [userId]
  );

  return {
    totalProjects: Number(totalProjects.rows[0].count),
    totalBugs: Number(totalBugs.rows[0].count),
    openBugs: Number(openBugs.rows[0].count),
    inProgressBugs: Number(inProgressBugs.rows[0].count),
    resolvedBugs: Number(resolvedBugs.rows[0].count)
  };
};

export const getRecentBugs = async (projectId, userId) => {
  await ensureProjectOwner(projectId, userId);

  const result = await pool.query(
    `
    SELECT
      ab.id,
      ab.bug_title AS title,
      ab.status,
      ab.severity AS priority,
      p.name AS project_name
    FROM ai_bugs ab
    JOIN projects p
      ON ab.project_id = p.id
    WHERE ab.project_id=$1
AND ab.status!='Resolved'
ORDER BY ab.created_at DESC
LIMIT 5
    `,
    [projectId]
  );

  return result.rows;
};

export const getBugChartData = async (projectId, userId) => {
  await ensureProjectOwner(projectId, userId);

  const result = await pool.query(
    `
    SELECT
      ab.status,
      COUNT(*) AS count
    FROM ai_bugs ab
    JOIN projects p
      ON p.id = ab.project_id
    WHERE ab.project_id = $1
    GROUP BY ab.status
    ORDER BY ab.status
    `,
    [projectId]
  );

  return result.rows;
};