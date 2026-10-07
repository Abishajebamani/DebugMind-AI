import pool from "../database/db.js";

// Save attachment
export const uploadAttachment = async (
  bugId,
  userId,
  file
) => {
  const result = await pool.query(
    `
    INSERT INTO bug_attachments (
      bug_id,
      uploaded_by,
      file_name,
      file_path,
      file_type
    )
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *;
    `,
    [
      bugId,
      userId,
      file.originalname,
      file.path,
      file.mimetype,
    ]
  );

  return result.rows[0];
};

// Get attachments
export const getAttachments = async (bugId) => {
  const result = await pool.query(
    `
    SELECT
      ba.*,
      u.name
    FROM bug_attachments ba
    JOIN users u
      ON ba.uploaded_by = u.id
    WHERE bug_id = $1
    ORDER BY uploaded_at DESC;
    `,
    [bugId]
  );

  return result.rows;
};