import pool from "../database/db.js";

// Add Comment
export const createComment = async (bugId, userId, comment) => {
  const result = await pool.query(
    `
    INSERT INTO bug_comments (
      bug_id,
      user_id,
      comment
    )
    VALUES ($1, $2, $3)
    RETURNING *;
    `,
    [bugId, userId, comment]
  );

  return result.rows[0];
};

// Get Comments for a Bug
export const getComments = async (bugId) => {
  const result = await pool.query(
    `
    SELECT
      bc.id,
      bc.comment,
      bc.created_at,
      u.id AS user_id,
      u.name,
      u.role
    FROM bug_comments bc
    JOIN users u
      ON bc.user_id = u.id
    WHERE bc.bug_id = $1
    ORDER BY bc.created_at ASC;
    `,
    [bugId]
  );

  return result.rows;
};