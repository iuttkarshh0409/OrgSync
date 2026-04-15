const taskService = require("../services/taskService");
const { httpError } = require("../utils/httpError");

function validateTaskPayload(body, { partial = false } = {}) {
  if (!partial && !body.title) {
    throw httpError(400, "title is required");
  }

  if (
    body.status &&
    !["todo", "in_progress", "done"].includes(body.status)
  ) {
    throw httpError(400, "status must be todo, in_progress, or done");
  }

  if (partial && Object.keys(body).length === 0) {
    throw httpError(400, "At least one field is required");
  }
}

async function listTasks(req, res, next) {
  try {
    const data = await taskService.listTasks(req.user);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getTask(req, res, next) {
  try {
    const data = await taskService.getTaskById(req.user, req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function createTask(req, res, next) {
  try {
    validateTaskPayload(req.body);
    const data = await taskService.createTask(req.user, req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    validateTaskPayload(req.body, { partial: true });
    const data = await taskService.updateTask(
      req.user,
      req.params.id,
      req.body
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(req.user, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function listTaskActivity(req, res, next) {
  try {
    const data = await taskService.listTaskActivity(req.user, req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTask,
  deleteTask,
  getTask,
  listTaskActivity,
  listTasks,
  updateTask
};
