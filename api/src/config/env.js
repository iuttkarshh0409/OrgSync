require("dotenv").config();

const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/task_manager",
  jwtSecret: process.env.JWT_SECRET || "development-secret",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
};

module.exports = { env };
