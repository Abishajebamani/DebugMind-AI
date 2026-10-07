import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AnimatedBackground from "../../components/common/AnimatedBackground";
import AuthCard from "../../components/common/AuthCard";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";

import { loginUser } from "../../services/authService";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (formData) => {
  try {
    const response = await loginUser(formData);

    console.log("Login Response:", response);

    // Save JWT Token
    const token = response.token || response.data?.token;

    if (!token) {
      toast.error("Token not received from server.");
      console.error(
        "No token found in response:",
        response
      );
      return;
    }

    // Save token
    localStorage.setItem("token", token);

    // Save logged-in user
    const user = response.user || response.data?.user;

    if (!user) {
      console.error(
        "User not received from server:",
        response
      );

      toast.error(
        "User information not received."
      );

      return;
    }

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    console.log("Logged-in user:", user);

    toast.success("Login Successful!");

    navigate("/dashboard");
  } catch (error) {
    console.error(error);

    toast.error(
      error.response?.data?.message ||
        "Login Failed"
    );
  }
};

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <AnimatedBackground />

      <AuthCard>
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            DebugMind AI
          </h1>

          <p className="text-slate-400 mt-3">
            AI Powered Bug Tracking Platform
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            {...register("email", {
              required: "Email is required",
            })}
          />

          {errors.email && (
            <p className="text-red-400 text-sm">
              {errors.email.message}
            </p>
          )}

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
              })}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[52px] text-slate-400 hover:text-white"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="text-red-400 text-sm">
              {errors.password.message}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center mt-8 text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-cyan-400 hover:underline"
          >
            Register
          </Link>
        </p>
      </AuthCard>
    </div>
  );
};

export default Login;