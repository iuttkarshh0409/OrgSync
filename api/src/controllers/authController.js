const authService = require("../services/authService");
const { httpError } = require("../utils/httpError");

function validateRegistrationPayload(body) {
  if (
    !body.organizationName ||
    !body.fullName ||
    !body.email ||
    !body.password
  ) {
    throw httpError(
      400,
      "organizationName, fullName, email, and password are required"
    );
  }
}

function validateLoginPayload(body) {
  if (!body.email || !body.password) {
    throw httpError(400, "email and password are required");
  }
}

async function register(req, res, next) {
  try {
    validateRegistrationPayload(req.body);
    const data = await authService.registerOrganizationAdmin(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    validateLoginPayload(req.body);
    const data = await authService.login(req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const data = await authService.getCurrentUser(req.user.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = { login, me, register };
