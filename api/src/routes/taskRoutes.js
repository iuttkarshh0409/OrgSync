const express = require("express");
const {
  createTask,
  deleteTask,
  getTask,
  listTaskActivity,
  listTasks,
  updateTask
} = require("../controllers/taskController");
const { authenticate } = require("../middleware/authenticate");
const { validateRequest } = require("../middleware/validateRequest");
const {
  validateCreateTaskBody,
  validateTaskIdParams,
  validateUpdateTaskBody
} = require("../validators/taskValidator");

const router = express.Router();

router.use(authenticate);
router.get("/", listTasks);
router.post("/", validateRequest({ body: validateCreateTaskBody }), createTask);
router.get("/:id", validateRequest({ params: validateTaskIdParams }), getTask);
router.patch(
  "/:id",
  validateRequest({ params: validateTaskIdParams, body: validateUpdateTaskBody }),
  updateTask
);
router.delete(
  "/:id",
  validateRequest({ params: validateTaskIdParams }),
  deleteTask
);
router.get(
  "/:id/activity",
  validateRequest({ params: validateTaskIdParams }),
  listTaskActivity
);

module.exports = router;
