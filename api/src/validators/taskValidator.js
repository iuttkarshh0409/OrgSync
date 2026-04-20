const { sanitizeTaskPayload, validateIdParam } = require("../utils/validation");

function validateTaskIdParams(params) {
  return {
    id: validateIdParam(params.id, "task id")
  };
}

function validateCreateTaskBody(body) {
  return sanitizeTaskPayload(body);
}

function validateUpdateTaskBody(body, req) {
  return sanitizeTaskPayload(body, {
    partial: true,
    memberOnly: req.user.role === "member"
  });
}

module.exports = {
  validateCreateTaskBody,
  validateTaskIdParams,
  validateUpdateTaskBody
};
