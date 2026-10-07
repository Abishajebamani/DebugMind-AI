import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "DebugMind AI API",
      version: "1.0.0",
      description: "Bug Tracking System API Documentation",
    },

    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://debugmind-ai-3y1u.onrender.com"
            : "http://localhost:5000",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: [path.join(__dirname, "../routes/*.js")],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;