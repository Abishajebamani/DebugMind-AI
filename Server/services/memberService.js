import pool from "../database/db.js";

export const ensureProjectOwnerMembership = async (projectId, userId) => {
  const existing = await pool.query(
    "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
    [projectId, userId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const result = await pool.query(
    `
    INSERT INTO project_members (project_id, user_id, role)
    VALUES ($1, $2, $3)
    RETURNING *;
    `,
    [projectId, userId, "Project Manager"]
  );

  return result.rows[0];
};

export const addMember = async (memberData) => {
  const { project_id, user_id, role } = memberData;

  const existing = await pool.query(
    "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
    [project_id, user_id]
  );

  if (existing.rows.length > 0) {
    throw new Error("User is already a member of this project");
  }

  const result = await pool.query(
    `
    INSERT INTO project_members (
      project_id,
      user_id,
      role
    )
    VALUES ($1, $2, $3)
    RETURNING *;
    `,
    [project_id, user_id, role]
  );

  return result.rows[0];
};

export const getMembers = async (projectId) => {
  const result = await pool.query(
    `
  SELECT
  pm.id,
  u.id AS user_id,
  u.name,
  u.email,
  pm.role
  FROM project_members pm
  JOIN users u
  ON pm.user_id = u.id
  WHERE pm.project_id = $1
  ORDER BY u.name;
    `,
    [projectId]
  );

  return result.rows.map((member) => ({
  id: member.id,
  userId: member.user_id,
  name: member.name,
  email: member.email,
  role: member.role,
}));
};

export const updateMemberRole = async (memberId, role) => {
  const result = await pool.query(
    `
    UPDATE project_members
    SET role = $1
    WHERE id = $2
    RETURNING *;
    `,
    [role, memberId]
  );

  return result.rows[0];
};

export const removeMember = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM project_members
    WHERE id = $1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};

export const findProjectMembership = async (projectId, userId) => {
  const result = await pool.query(
    "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
    [projectId, userId]
  );

  return result.rows[0] || null;
};

export const findProjectById = async (projectId) => {
  const result = await pool.query("SELECT id, user_id FROM projects WHERE id = $1", [projectId]);
  return result.rows[0] || null;
};

export const findUserByEmail = async (email) => {
  const result = await pool.query("SELECT id, name, email, role FROM users WHERE email = $1", [email]);
  return result.rows[0] || null;
};

export const findMemberById = async (memberId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM project_members
    WHERE id = $1
    `,
    [memberId]
  );

  return result.rows[0] || null;
};

export const getAssignableMembers = async (projectId) => {
  const result = await pool.query(
    `
    SELECT
      pm.id,
      u.id AS user_id,
      u.name,
      u.email,
      pm.role
    FROM project_members pm
    JOIN users u
      ON pm.user_id = u.id
    WHERE pm.project_id = $1
      AND pm.role IN ('Developer', 'Tester')
    ORDER BY u.name;
    `,
    [projectId]
  );

  return result.rows.map((member) => ({
    id: member.id,
    userId: member.user_id,
    name: member.name,
    email: member.email,
    role: member.role,
  }));
};