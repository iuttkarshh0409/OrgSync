const {
  sanitizeLoginPayload,
  sanitizeRegistrationPayload
} = require("../utils/validation");

function validateRegisterBody(body) {
  return sanitizeRegistrationPayload(body);
}

function validateLoginBody(body) {
  return sanitizeLoginPayload(body);
}

module.exports = {
  validateLoginBody,
  validateRegisterBody
};
