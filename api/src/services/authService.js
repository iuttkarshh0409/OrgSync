const bcrypt = require("bcryptjs");
const { pool } = require("../db/pool");
const { httpError } = require("../utils/httpError");
const { signToken } = require("../utils/jwt");

async function registerOrganizationAdmin(payload) {
  const client = await pool.connect();

  try {
    const { organizationName, fullName, email, password } = payload;
    const passwordHash = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    const organizationResult = await client.query(
      `INSERT INTO organizations (name)
       VALUES ($1)
       RETURNING id, name, created_at`,
      [organizationName]
    );

    const organization = organizationResult.rows[0];
    const userResult = await client.query(
      `INSERT INTO users (organization_id, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id, organization_id, full_name, email, role, created_at`,
      [organization.id, fullName, email.toLowerCase(), passwordHash]
    );

    await client.query("COMMIT");

    const user = userResult.rows[0];
    return {
      token: signToken(user),
      user: {
        ...user,
        organization
      }
    };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      throw httpError(409, "Email is already registered");
    }
    throw error;
  } finally {
    client.release();
  }
}

async function login(payload) {
  const { email, password } = payload;
  const result = await pool.query(
    `SELECT u.id,
            u.organization_id,
            u.full_name,
            u.email,
            u.password_hash,
            u.role,
            o.name AS organization_name
     FROM users u
     JOIN organizations o ON o.id = u.organization_id
     WHERE u.email = $1`,
    [email.toLowerCase()]
  );

  const user = result.rows[0];
  if (!user) {
    throw httpError(401, "Invalid email or password");
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    throw httpError(401, "Invalid email or password");
  }

  return {
    token: signToken(user),
    user: {
      id: user.id,
      organization_id: user.organization_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      organization: {
        id: user.organization_id,
        name: user.organization_name
      }
    }
  };
}

async function getCurrentUser(userId) {
  const result = await pool.query(
    `SELECT u.id,
            u.organization_id,
            u.full_name,
            u.email,
            u.role,
            o.name AS organization_name
     FROM users u
     JOIN organizations o ON o.id = u.organization_id
     WHERE u.id = $1`,
    [userId]
  );

  if (!result.rows[0]) {
    throw httpError(404, "User not found");
  }

  const user = result.rows[0];
  return {
    id: user.id,
    organization_id: user.organization_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    organization: {
      id: user.organization_id,
      name: user.organization_name
    }
  };
}

module.exports = {
  getCurrentUser,
  login,
  registerOrganizationAdmin
};
