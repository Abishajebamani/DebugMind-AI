import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import pool from "./database/db.js";

const PORT = process.env.PORT || 5000;

const ensureDatabaseSchema = async () => {
  const statements = [
    "ALTER TABLE ai_bugs ADD COLUMN IF NOT EXISTS source_file_path TEXT",
    "ALTER TABLE ai_bugs ADD COLUMN IF NOT EXISTS source_code_snippet TEXT",
    "ALTER TABLE ai_bugs ADD COLUMN IF NOT EXISTS old_code TEXT",
    "ALTER TABLE ai_bugs ADD COLUMN IF NOT EXISTS new_code TEXT",
    "ALTER TABLE ai_bugs ADD COLUMN IF NOT EXISTS generated_patch TEXT",
    "ALTER TABLE ai_bugs ADD COLUMN IF NOT EXISTS ai_explanation TEXT",
    "ALTER TABLE ai_bugs ADD COLUMN IF NOT EXISTS confidence INTEGER DEFAULT 0",
    "ALTER TABLE ai_bugs ADD COLUMN IF NOT EXISTS fix_status VARCHAR(30) DEFAULT 'Open'",
  ];

  for (const statement of statements) {
    await pool.query(statement);
  }
};

const startServer = async () => {
  try {
    await pool.query("SELECT NOW()");
    await ensureDatabaseSchema();

    console.log("PostgreSQL Connected Successfully");

    app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
  } catch (error) {
    console.error(" Database Connection Failed");
    console.error(error.message);
  }
};

startServer();