import pool from "../database/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (userData) => {
  const { name, email, password, role } = userData;

  // Check if email already exists
  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("Email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user
  const result = await pool.query(
    `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at
    `,
    [name, email, hashedPassword, role]
  );

  return result.rows[0];
};

export const loginUser = async (email, password) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  const user = result.rows[0];

  console.log("User found:", user);
  // Compare password
const isMatch = await bcrypt.compare(password, user.password);

console.log("Password Match:", isMatch);

if (!isMatch) {
  throw new Error("Invalid email or password");
}

// Generate JWT
console.log("Login Secret:", process.env.JWT_SECRET);
const token = jwt.sign(
  {
    id: user.id,
    role: user.role,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "7d",
  }
);

// Return user and token
return {
  token,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  },
};
};

export const updateProject = async (projectId, userId, projectData) => {
  const { name, description } = projectData;

  const result = await pool.query(
    `
    UPDATE projects
    SET name = $1,
        description = $2
    WHERE id = $3
      AND user_id = $4
    RETURNING *;
    `,
    [name, description, projectId, userId]
  );

  return result.rows[0];
};