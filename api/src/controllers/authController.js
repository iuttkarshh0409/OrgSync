const authService = require("../services/authService");

async function register(req, res, next) {
  try {
    const data = await authService.registerOrganizationAdmin(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
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
