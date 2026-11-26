import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../context/AuthProvider";
import { RegisterData } from "../types";
import { registerSchema, type RegisterFormData } from "../dto/auth.dto";
import { getServerFieldErrors } from "../utils/errors";

type RegisterFieldErrors = Partial<Record<keyof RegisterFormData, string>>;

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState<RegisterData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({
      ...prev,
      [e.target.name]: undefined,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setError("");

    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setFieldErrors({
        firstName: fieldErrors.firstName?.[0],
        lastName: fieldErrors.lastName?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await register(result.data);
      navigate("/sessions");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const responseData = err.response?.data as
          | {
              message?: string;
              errors?: unknown;
            }
          | undefined;
        const serverFieldErrors = getServerFieldErrors(responseData);

        if (Object.keys(serverFieldErrors).length > 0) {
          setFieldErrors((prev) => ({
            ...prev,
            ...serverFieldErrors,
          }));
          setError("");
        } else if (responseData?.message === "Email already exists") {
          setFieldErrors((prev) => ({
            ...prev,
            email: "Email already exists",
          }));
          setError("");
        } else {
          setError(responseData?.message ?? "Registration failed");
        }
      } else {
        setError("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Register for Yoga Studio
        </h2>

        {error ? (
          <div
            role="alert"
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="register-first-name"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              First Name
            </label>
            <input
              id="register-first-name"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.firstName)}
              aria-describedby={
                fieldErrors.firstName ? "register-first-name-error" : undefined
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              required
            />
            {fieldErrors.firstName ? (
              <p
                id="register-first-name-error"
                role="alert"
                className="mt-1 text-sm text-red-600"
              >
                {fieldErrors.firstName}
              </p>
            ) : null}
          </div>

          <div className="mb-4">
            <label
              htmlFor="register-last-name"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Last Name
            </label>
            <input
              id="register-last-name"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.lastName)}
              aria-describedby={
                fieldErrors.lastName ? "register-last-name-error" : undefined
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              required
            />
            {fieldErrors.lastName ? (
              <p
                id="register-last-name-error"
                role="alert"
                className="mt-1 text-sm text-red-600"
              >
                {fieldErrors.lastName}
              </p>
            ) : null}
          </div>

          <div className="mb-4">
            <label
              htmlFor="register-email"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Email
            </label>
            <input
              id="register-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={
                fieldErrors.email ? "register-email-error" : undefined
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              required
            />
            {fieldErrors.email ? (
              <p
                id="register-email-error"
                role="alert"
                className="mt-1 text-sm text-red-600"
              >
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="mb-6">
            <label
              htmlFor="register-password"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Password
            </label>
            <input
              id="register-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? "register-password-error" : undefined
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              required
              minLength={8}
            />
            {fieldErrors.password ? (
              <p
                id="register-password-error"
                role="alert"
                className="mt-1 text-sm text-red-600"
              >
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
