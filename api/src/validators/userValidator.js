const { sanitizeUserPayload } = require("../utils/validation");

function validateCreateUserBody(body) {
  return sanitizeUserPayload(body);
}

module.exports = { validateCreateUserBody };
