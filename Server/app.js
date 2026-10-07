import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import bugRoutes from "./routes/bugRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import path from "path";
import attachmentRoutes from "./routes/attachmentRoutes.js";
import aiProjectRoutes from "./routes/aiProjectRoutes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join("uploads")));

// Routes
app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/ai-projects", aiProjectRoutes);
app.use("/api/bugs", bugRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", memberRoutes);
app.use("/api", commentRoutes);
app.use("/api", attachmentRoutes);
app.use("/api-docs",swaggerUi.serve,swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to DebugMind AI Backend 🚀",
  });
});

export default app;