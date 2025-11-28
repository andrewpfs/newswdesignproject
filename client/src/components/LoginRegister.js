import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { isAuthenticated, getUserRole } from "../utils/auth";
import "../App.css";

const LoginRegister = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      const role = getUserRole();
      if (role === "admin") {
        navigate("/");
      } else {
        navigate("/profile");
      }
    }
  }, [navigate]);

  const loginSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .required("Password is required"),
  });

  const registerSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Please confirm your password"),
  });

  const handleLogin = async (values, { setSubmitting, setErrors }) => {
    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (response.ok) {
        // Store auth data (data is nested in result.data)
        localStorage.setItem("authToken", result.data.token);
        localStorage.setItem("userId", result.data.user.id);
        localStorage.setItem("userRole", result.data.user.role);
        localStorage.setItem("userEmail", result.data.user.email);
        
        // Redirect based on role
        if (result.data.user.role === "admin") {
          window.location.href = "/"; // Admin goes to create event
        } else {
          window.location.href = "/profile"; // Volunteer goes to profile to complete their profile
        }
      } else {
        setErrors({ submit: result.error || "Login failed" });
      }
    } catch (error) {
      setErrors({ submit: "Server error. Please try again." });
    }
    setSubmitting(false);
  };

  const handleRegister = async (values, { setSubmitting, setErrors }) => {
    try {
      const response = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Auto-login after successful registration and redirect to profile
        alert("Registration successful! Redirecting to profile setup...");
        
        // Automatically log them in
        const loginResponse = await fetch("http://localhost:3001/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: values.email,
            password: values.password,
          }),
        });

        const loginResult = await loginResponse.json();

        if (loginResponse.ok) {
          // Store auth data
          localStorage.setItem("authToken", loginResult.data.token);
          localStorage.setItem("userId", loginResult.data.user.id);
          localStorage.setItem("userRole", loginResult.data.user.role);
          localStorage.setItem("userEmail", loginResult.data.user.email);
          
          // Redirect to profile to complete setup
          window.location.href = "/profile";
        } else {
          // If auto-login fails, just switch to login form
          setIsLogin(true);
        }
      } else {
        setErrors({ submit: result.error || "Registration failed" });
      }
    } catch (error) {
      setErrors({ submit: "Server error. Please try again." });
    }
    setSubmitting(false);
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${isLogin ? "active" : ""}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${!isLogin ? "active" : ""}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <Formik
          initialValues={{
            email: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={isLogin ? loginSchema : registerSchema}
          onSubmit={isLogin ? handleLogin : handleRegister}
          enableReinitialize
        >
          {({ isSubmitting, errors }) => (
            <Form>
              <h1>{isLogin ? "Welcome Back" : "Create Account"}</h1>

              <div className="field">
                <label htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  placeholder="your.email@example.com"
                />
                <ErrorMessage name="email" component="div" className="error" />
              </div>

              <div className="field">
                <label htmlFor="password">
                  Password <span className="required">*</span>
                </label>
                <Field
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter password (8-128 characters)"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="error"
                />
              </div>

              {!isLogin && (
                <div className="field">
                  <label htmlFor="confirmPassword">
                    Confirm Password <span className="required">*</span>
                  </label>
                  <Field
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Re-enter password"
                  />
                  <ErrorMessage
                    name="confirmPassword"
                    component="div"
                    className="error"
                  />
                </div>
              )}

              {errors.submit && (
                <div className="notice error">{errors.submit}</div>
              )}

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Please wait..."
                  : isLogin
                  ? "Login"
                  : "Sign Up"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default LoginRegister;

