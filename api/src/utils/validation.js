const FIELD_LIMITS = {
  organizationName: 100,
  fullName: 20,
  email: 30,
  password: 64,
  taskTitle: 100,
  taskDescription: 500
};

const MIN_LENGTHS = {
  organizationName: 3,
  fullName: 3,
  password: 8,
  taskTitle: 3
};

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const MARKUP_PATTERN = /<[^>]*>|[<>]/;
const SUSPICIOUS_PATTERN = /(--|\/\*|\*\/|;)/;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]+@gmail\.com$/;
const EMAIL_ALLOWED_CHARACTERS_PATTERN = /^[A-Za-z0-9._%+\-@]+$/;
const FULL_NAME_PATTERN = /^[A-Za-z]+( [A-Za-z]+)*$/;

function createValidationError(message) {
  const error = new Error(message);
  error.name = "ValidationError";
  error.statusCode = 400;
  return error;
}

function ensurePlainObject(value, fieldName = "request body") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(`${fieldName} must be a valid object`);
  }

  return value;
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function ensureString(value, fieldName) {
  if (typeof value !== "string") {
    throw createValidationError(`${fieldName} must be a text value`);
  }

  return value;
}

function rejectUnexpectedFields(payload, allowedFields) {
  const unexpectedFields = Object.keys(payload).filter(
    (fieldName) => !allowedFields.includes(fieldName)
  );

  if (unexpectedFields.length > 0) {
    throw createValidationError(
      `Unexpected field(s): ${unexpectedFields.join(", ")}`
    );
  }
}

function validateSafeText(value, options) {
  const {
    fieldName,
    minLength = 1,
    maxLength,
    allowEmpty = false,
    multiLine = false,
    disallowMarkup = false,
    rejectSuspicious = false
  } = options;

  const rawValue = ensureString(value, fieldName);
  const normalizedValue = multiLine ? rawValue.trim() : normalizeWhitespace(rawValue);

  if (!allowEmpty && normalizedValue.length === 0) {
    throw createValidationError(`${fieldName} is required`);
  }

  if (CONTROL_CHARACTER_PATTERN.test(normalizedValue)) {
    throw createValidationError(
      `${fieldName} contains unsupported control characters`
    );
  }

  if (disallowMarkup && MARKUP_PATTERN.test(normalizedValue)) {
    throw createValidationError(
      `${fieldName} cannot contain markup-like characters`
    );
  }

  if (rejectSuspicious && SUSPICIOUS_PATTERN.test(normalizedValue)) {
    throw createValidationError(`${fieldName} contains unsupported characters`);
  }

  if (!allowEmpty && normalizedValue.length < minLength) {
    throw createValidationError(
      `${fieldName} must be at least ${minLength} characters long`
    );
  }

  if (typeof maxLength === "number" && normalizedValue.length > maxLength) {
    throw createValidationError(
      `${fieldName} must be ${maxLength} characters or fewer`
    );
  }

  return normalizedValue;
}

function validateEmail(value) {
  const email = validateSafeText(value, {
    fieldName: "email",
    maxLength: FIELD_LIMITS.email
  }).toLowerCase();

  if (!EMAIL_ALLOWED_CHARACTERS_PATTERN.test(email)) {
    throw createValidationError("Invalid email format");
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw createValidationError("Invalid email format");
  }

  return email;
}

function validatePassword(value) {
  const password = ensureString(value, "password").trim();

  if (password.length === 0) {
    throw createValidationError("password is required");
  }

  if (CONTROL_CHARACTER_PATTERN.test(password)) {
    throw createValidationError("password contains unsupported characters");
  }

  if (
    password.length < MIN_LENGTHS.password ||
    password.length > FIELD_LIMITS.password ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    throw createValidationError(
      "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
    );
  }

  return password;
}

function validateFullName(value) {
  const fullName = validateSafeText(value, {
    fieldName: "fullName",
    minLength: MIN_LENGTHS.fullName,
    maxLength: FIELD_LIMITS.fullName,
    disallowMarkup: true,
    rejectSuspicious: true
  });

  if (!FULL_NAME_PATTERN.test(fullName)) {
    throw createValidationError(
      "fullName can contain only letters and single spaces between words"
    );
  }

  return fullName;
}

function validateOrganizationName(value) {
  return validateSafeText(value, {
    fieldName: "organizationName",
    minLength: MIN_LENGTHS.organizationName,
    maxLength: FIELD_LIMITS.organizationName,
    disallowMarkup: true,
    rejectSuspicious: true
  });
}

function validateTaskTitle(value) {
  return validateSafeText(value, {
    fieldName: "title",
    minLength: MIN_LENGTHS.taskTitle,
    maxLength: FIELD_LIMITS.taskTitle,
    disallowMarkup: true,
    rejectSuspicious: true
  });
}

function validateTaskDescription(value) {
  return validateSafeText(value ?? "", {
    fieldName: "description",
    allowEmpty: true,
    maxLength: FIELD_LIMITS.taskDescription,
    multiLine: true
  });
}

function validateRole(value) {
  if (!["admin", "member"].includes(value)) {
    throw createValidationError("role must be either admin or member");
  }

  return value;
}

function validateStatus(value) {
  if (!["todo", "in_progress", "done"].includes(value)) {
    throw createValidationError("status must be todo, in_progress, or done");
  }

  return value;
}

function validateOptionalAssignee(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw createValidationError("assignedTo must be a valid user id");
  }

  return numericValue;
}

function validateIdParam(value, fieldName = "id") {
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw createValidationError(`${fieldName} must be a valid numeric id`);
  }

  return numericValue;
}

function sanitizeRegistrationPayload(body) {
  const payload = ensurePlainObject(body);
  rejectUnexpectedFields(payload, [
    "organizationName",
    "fullName",
    "email",
    "password"
  ]);

  return {
    organizationName: validateOrganizationName(payload.organizationName),
    fullName: validateFullName(payload.fullName),
    email: validateEmail(payload.email),
    password: validatePassword(payload.password)
  };
}

function sanitizeLoginPayload(body) {
  const payload = ensurePlainObject(body);
  rejectUnexpectedFields(payload, ["email", "password"]);

  return {
    email: validateEmail(payload.email),
    password: validatePassword(payload.password)
  };
}

function sanitizeUserPayload(body) {
  const payload = ensurePlainObject(body);
  rejectUnexpectedFields(payload, ["fullName", "email", "password", "role"]);

  return {
    fullName: validateFullName(payload.fullName),
    email: validateEmail(payload.email),
    password: validatePassword(payload.password),
    role: validateRole(payload.role)
  };
}

function sanitizeTaskPayload(body, { partial = false, memberOnly = false } = {}) {
  const payload = ensurePlainObject(body);
  const allowedFields = memberOnly
    ? ["status"]
    : ["title", "description", "status", "assignedTo"];

  rejectUnexpectedFields(payload, allowedFields);

  const sanitized = {};

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "title")) {
    sanitized.title = validateTaskTitle(payload.title);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "description")) {
    sanitized.description = validateTaskDescription(payload.description);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "status")) {
    sanitized.status = validateStatus(payload.status || "todo");
  }

  if (!memberOnly && Object.prototype.hasOwnProperty.call(payload, "assignedTo")) {
    sanitized.assignedTo = validateOptionalAssignee(payload.assignedTo);
  }

  if (partial && Object.keys(sanitized).length === 0) {
    throw createValidationError("At least one valid field is required");
  }

  return sanitized;
}

module.exports = {
  FIELD_LIMITS,
  MIN_LENGTHS,
  createValidationError,
  sanitizeLoginPayload,
  sanitizeRegistrationPayload,
  sanitizeTaskPayload,
  sanitizeUserPayload,
  validateIdParam
};
