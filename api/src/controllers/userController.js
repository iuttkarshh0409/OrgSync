const userService = require("../services/userService");
const { httpError } = require("../utils/httpError");

function validateUserPayload(body) {
  if (!body.fullName || !body.email || !body.password || !body.role) {
    throw httpError(400, "fullName, email, password, and role are required");
  }

  if (!["admin", "member"].includes(body.role)) {
    throw httpError(400, "role must be either admin or member");
  }
}

async function listUsers(req, res, next) {
  try {
    const data = await userService.listUsers(req.user);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    validateUserPayload(req.body);
    const data = await userService.createUser(req.user, req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = { createUser, listUsers };
