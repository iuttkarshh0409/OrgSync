const userService = require("../services/userService");

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
    const data = await userService.createUser(req.user, req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = { createUser, listUsers };
