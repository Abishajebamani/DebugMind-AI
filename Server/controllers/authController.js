import { registerSchema, loginSchema } from "../validators/authValidator.js";
import { registerUser, loginUser } from "../services/authService.js";

export const register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const user = await registerUser(validatedData);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error("Register Error:", error);

    // Zod validation error
    if (error?.issues?.length > 0) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
      });
    }

    // Normal application error
    return res.status(400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

export const login = async (req, res) => {
  try {
    // Validate request
    const validatedData = loginSchema.parse(req.body);

    // Call service
    const result = await loginUser(
      validatedData.email,
      validatedData.password
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};