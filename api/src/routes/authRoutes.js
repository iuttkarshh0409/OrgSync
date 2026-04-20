const express = require("express");
const { login, me, register } = require("../controllers/authController");
const { authenticate } = require("../middleware/authenticate");
const { validateRequest } = require("../middleware/validateRequest");
const {
  validateLoginBody,
  validateRegisterBody
} = require("../validators/authValidator");

const router = express.Router();

router.post("/register", validateRequest({ body: validateRegisterBody }), register);
router.post("/login", validateRequest({ body: validateLoginBody }), login);
router.get("/me", authenticate, me);

module.exports = router;
