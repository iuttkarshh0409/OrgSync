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

const router = express.Router();

router.use(authenticate);
router.get("/", listTasks);
router.post("/", createTask);
router.get("/:id", getTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);
router.get("/:id/activity", listTaskActivity);

module.exports = router;
