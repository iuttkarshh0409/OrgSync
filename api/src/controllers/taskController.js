const taskService = require("../services/taskService");

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
    const data = await taskService.getTaskById(req.user, req.validatedParams.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function createTask(req, res, next) {
  try {
    const data = await taskService.createTask(req.user, req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const data = await taskService.updateTask(
      req.user,
      req.validatedParams.id,
      req.body
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(req.user, req.validatedParams.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function listTaskActivity(req, res, next) {
  try {
    const data = await taskService.listTaskActivity(
      req.user,
      req.validatedParams.id
    );
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
