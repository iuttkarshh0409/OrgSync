const express = require("express");
const { createUser, listUsers } = require("../controllers/userController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorizeRole");
const { validateRequest } = require("../middleware/validateRequest");
const { validateCreateUserBody } = require("../validators/userValidator");

const router = express.Router();

router.use(authenticate, authorizeRole("admin"));
router.get("/", listUsers);
router.post("/", validateRequest({ body: validateCreateUserBody }), createUser);

module.exports = router;
