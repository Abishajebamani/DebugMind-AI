import pool from "../database/db.js";

// =====================================================
// CREATE BUG
// =====================================================

export const createBug = async (bugData, createdBy) => {
  const {
    title,
    description,
    priority,
    project_id,
    assigned_to,
  } = bugData;

  // If a user was assigned while creating the bug,
  // verify that they belong to the project and are
  // either Developer or Tester.
  if (assigned_to) {
    const memberCheck = await pool.query(
      `
      SELECT pm.id
      FROM project_members pm
      WHERE pm.project_id = $1
        AND pm.user_id = $2
        AND pm.role IN ('Developer', 'Tester')
      `,
      [project_id, assigned_to]
    );

    if (memberCheck.rows.length === 0) {
      throw new Error(
        "Bug can only be assigned to a Developer or Tester belonging to this project"
      );
    }
  }

  const result = await pool.query(
    `
    INSERT INTO bugs (
      title,
      description,
      priority,
      project_id,
      created_by,
      assigned_to
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
    `,
    [
      title,
      description,
      priority,
      project_id,
      createdBy,
      assigned_to || null,
    ]
  );

  return result.rows[0];
};


// =====================================================
// GET BUGS
// =====================================================

export const getBugs = async (userId, query) => {
  const {
    search,
    status,
    priority,
    page = 1,
    limit = 10,
  } = query;

  let sql = `
    SELECT
      b.*,
      p.name AS project_name,
      u.name AS assigned_to_name,
      u.email AS assigned_to_email
    FROM bugs b

    JOIN projects p
      ON b.project_id = p.id

    LEFT JOIN users u
      ON b.assigned_to = u.id

    WHERE b.created_by = $1
  `;

  const values = [userId];
  let index = 2;

  if (search) {
    sql += `
      AND LOWER(b.title)
      LIKE LOWER($${index})
    `;

    values.push(`%${search}%`);
    index++;
  }

  if (status) {
    sql += `
      AND b.status = $${index}
    `;

    values.push(status);
    index++;
  }

  if (priority) {
    sql += `
      AND b.priority = $${index}
    `;

    values.push(priority);
    index++;
  }

  sql += `
    ORDER BY b.created_at DESC
    LIMIT $${index}
    OFFSET $${index + 1};
  `;

  values.push(Number(limit));
  values.push(
    (Number(page) - 1) * Number(limit)
  );

  const result = await pool.query(
    sql,
    values
  );

  return result.rows;
};


// =====================================================
// UPDATE BUG
// =====================================================

export const updateBug = async (
  bugId,
  userId,
  bugData
) => {
  const {
    status,
    priority,
    assigned_to,
  } = bugData;

  // If assignment is being changed,
  // verify the new assignee.
  if (assigned_to) {
    const memberCheck = await pool.query(
      `
      SELECT pm.id
      FROM project_members pm
      JOIN bugs b
        ON b.project_id = pm.project_id
      WHERE b.id = $1
        AND pm.user_id = $2
        AND pm.role IN ('Developer', 'Tester')
      `,
      [bugId, assigned_to]
    );

    if (memberCheck.rows.length === 0) {
      throw new Error(
        "Bug can only be assigned to a Developer or Tester belonging to this project"
      );
    }
  }

  const result = await pool.query(
    `
    UPDATE bugs
    SET
      status = $1,
      priority = $2,
      assigned_to = $3,
      updated_at = NOW()
    WHERE id = $4
      AND created_by = $5
    RETURNING *;
    `,
    [
      status,
      priority,
      assigned_to || null,
      bugId,
      userId,
    ]
  );

  return result.rows[0];
};


// =====================================================
// DELETE BUG
// =====================================================

export const deleteBug = async (
  bugId,
  userId
) => {
  const result = await pool.query(
    `
    DELETE FROM bugs
    WHERE id = $1
      AND created_by = $2
    RETURNING *;
    `,
    [bugId, userId]
  );

  return result.rows[0];
};


// =====================================================
// ASSIGN BUG
// =====================================================

export const assignBug = async (bugId, assignedTo) => {
  // Make sure the selected user belongs to the same
  // project as the bug and has an allowed role.
  const result = await pool.query(
    `
    UPDATE bugs b
    SET
      assigned_to = $1,
      updated_at = NOW()
    FROM project_members pm
    WHERE b.id = $2
      AND pm.project_id = b.project_id
      AND pm.user_id = $1
      AND pm.role IN ('Developer', 'Tester')
    RETURNING b.*;
    `,
    [assignedTo, bugId]
  );

  return result.rows[0];
};

// =====================================================
// GET MY BUGS
// =====================================================

export const getMyBugs = async (
  userId
) => {
  const result = await pool.query(
    `
    SELECT
      b.*,
      p.name AS project_name,
      u.name AS assigned_to_name,
      u.email AS assigned_to_email
    FROM bugs b

    JOIN projects p
      ON b.project_id = p.id

    LEFT JOIN users u
      ON b.assigned_to = u.id

    WHERE b.assigned_to = $1

    ORDER BY b.created_at DESC;
    `,
    [userId]
  );

  return result.rows;
};


// =====================================================
// GET PROJECT BUGS
// =====================================================

export const getProjectBugsService = async (
  projectId,
  userId
) => {
  /*
   * First make sure the logged-in user has
   * access to this project.
   */

  const accessCheck = await pool.query(
    `
    SELECT
      p.id
    FROM projects p
    LEFT JOIN project_members pm
      ON pm.project_id = p.id
      AND pm.user_id = $2
    WHERE p.id = $1
      AND (
        p.user_id = $2
        OR pm.user_id = $2
      )
    `,
    [
      projectId,
      userId,
    ]
  );

  if (accessCheck.rows.length === 0) {
    throw new Error(
      "You do not have access to this project"
    );
  }

  const result = await pool.query(
    `
    SELECT
      b.*,
      p.name AS project_name,
      u.name AS assigned_to_name,
      u.email AS assigned_to_email
    FROM bugs b

    JOIN projects p
      ON b.project_id = p.id

    LEFT JOIN users u
      ON b.assigned_to = u.id

    WHERE b.project_id = $1

    ORDER BY b.created_at DESC;
    `,
    [projectId]
  );

  return result.rows;
};