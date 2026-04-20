const cors = require("cors");
const express = require("express");
const { env } = require("./config/env");
const { authRateLimit } = require("./middleware/authRateLimit");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true
  })
);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(express.json({ limit: "10kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRateLimit, authRoutes);
app.use("/users", userRoutes);
app.use("/tasks", taskRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    return res.status(500).json({
      error: "InternalServerError",
      message: "An unexpected server error occurred"
    });
  }

  return res.status(statusCode).json({
    error: err.name || "RequestError",
    message: err.message || "Request failed"
  });
});

module.exports = app;
