const express = require("express");
const { createUser, listUsers } = require("../controllers/userController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorizeRole");

const router = express.Router();

router.use(authenticate, authorizeRole("admin"));
router.get("/", listUsers);
router.post("/", createUser);

module.exports = router;
