const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      organizationId: user.organization_id,
      role: user.role
    },
    env.jwtSecret,
    { expiresIn: "12h" }
  );
}

module.exports = { signToken };
