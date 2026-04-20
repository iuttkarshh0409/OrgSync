export const CONSTRAINTS = {
  organizationNameMin: 3,
  organizationNameMax: 100,
  fullNameMin: 3,
  fullNameMax: 20,
  emailMax: 30,
  passwordMin: 8,
  passwordMax: 64,
  taskTitleMin: 3,
  taskTitleMax: 100,
  taskDescriptionMax: 500
};

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]+@gmail\.com$/;
const EMAIL_ALLOWED_CHARACTERS_PATTERN = /^[A-Za-z0-9._%+\-@]+$/;
const FULL_NAME_PATTERN = /^[A-Za-z]+( [A-Za-z]+)*$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const MARKUP_PATTERN = /<[^>]*>|[<>]/;
const SUSPICIOUS_PATTERN = /(--|\/\*|\*\/|;)/;

export function normalizeSingleLine(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function normalizeMultiline(value) {
  return String(value || "").trim();
}

function hasUnsafeInput(value) {
  return CONTROL_CHARACTER_PATTERN.test(value) || MARKUP_PATTERN.test(value);
}

function hasSuspiciousInput(value) {
  return SUSPICIOUS_PATTERN.test(value);
}

export function validateOrganizationName(value) {
  const normalizedValue = normalizeSingleLine(value);

  if (normalizedValue.length === 0) {
    return "Organization name is required.";
  }

  if (normalizedValue.length < CONSTRAINTS.organizationNameMin) {
    return `Organization name must be at least ${CONSTRAINTS.organizationNameMin} characters.`;
  }

  if (normalizedValue.length > CONSTRAINTS.organizationNameMax) {
    return `Organization name must be ${CONSTRAINTS.organizationNameMax} characters or fewer.`;
  }

  if (hasUnsafeInput(normalizedValue) || hasSuspiciousInput(normalizedValue)) {
    return "Organization name contains unsupported characters.";
  }

  return "";
}

export function validateFullName(value) {
  const normalizedValue = normalizeSingleLine(value);

  if (normalizedValue.length === 0) {
    return "Full name is required.";
  }

  if (normalizedValue.length < CONSTRAINTS.fullNameMin) {
    return `Full name must be at least ${CONSTRAINTS.fullNameMin} characters.`;
  }

  if (normalizedValue.length > CONSTRAINTS.fullNameMax) {
    return `Full name must be ${CONSTRAINTS.fullNameMax} characters or fewer.`;
  }

  if (hasUnsafeInput(normalizedValue) || hasSuspiciousInput(normalizedValue)) {
    return "Full name contains unsupported characters.";
  }

  if (!FULL_NAME_PATTERN.test(normalizedValue)) {
    return "Full name can contain only letters and single spaces between words.";
  }

  return "";
}

export function validateEmail(value) {
  const normalizedValue = normalizeSingleLine(value).toLowerCase();

  if (normalizedValue.length === 0) {
    return "Email is required.";
  }

  if (normalizedValue.length > CONSTRAINTS.emailMax) {
    return `Email must be ${CONSTRAINTS.emailMax} characters or fewer.`;
  }

  if (!EMAIL_ALLOWED_CHARACTERS_PATTERN.test(normalizedValue)) {
    return "Invalid email format";
  }

  if (!EMAIL_PATTERN.test(normalizedValue)) {
    return "Invalid email format";
  }

  return "";
}

export function validatePassword(value) {
  const normalizedValue = String(value || "").trim();

  if (normalizedValue.length === 0) {
    return "Password is required.";
  }

  if (
    normalizedValue.length < CONSTRAINTS.passwordMin ||
    normalizedValue.length > CONSTRAINTS.passwordMax ||
    !/[A-Z]/.test(normalizedValue) ||
    !/[a-z]/.test(normalizedValue) ||
    !/[0-9]/.test(normalizedValue) ||
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(normalizedValue)
  ) {
    return "Password must be at least 8 characters with uppercase, lowercase, number, and special character";
  }

  if (CONTROL_CHARACTER_PATTERN.test(normalizedValue)) {
    return "Password contains unsupported characters.";
  }

  return "";
}

export function validateTaskTitle(value) {
  const normalizedValue = normalizeSingleLine(value);

  if (normalizedValue.length === 0) {
    return "Title is required.";
  }

  if (normalizedValue.length < CONSTRAINTS.taskTitleMin) {
    return `Title must be at least ${CONSTRAINTS.taskTitleMin} characters.`;
  }

  if (normalizedValue.length > CONSTRAINTS.taskTitleMax) {
    return `Title too long (max ${CONSTRAINTS.taskTitleMax} chars)`;
  }

  if (hasUnsafeInput(normalizedValue) || hasSuspiciousInput(normalizedValue)) {
    return "Title contains unsupported characters.";
  }

  return "";
}

export function validateTaskDescription(value) {
  const normalizedValue = normalizeMultiline(value);

  if (normalizedValue.length > CONSTRAINTS.taskDescriptionMax) {
    return `Description must be ${CONSTRAINTS.taskDescriptionMax} characters or fewer.`;
  }

  if (CONTROL_CHARACTER_PATTERN.test(normalizedValue)) {
    return "Description contains unsupported characters.";
  }

  return "";
}

export function validateRegisterForm(form) {
  const errors = {
    organizationName: validateOrganizationName(form.organizationName),
    fullName: validateFullName(form.fullName),
    email: validateEmail(form.email),
    password: validatePassword(form.password)
  };

  return {
    errors,
    payload: {
      organizationName: normalizeSingleLine(form.organizationName),
      fullName: normalizeSingleLine(form.fullName),
      email: normalizeSingleLine(form.email).toLowerCase(),
      password: String(form.password || "").trim()
    }
  };
}

export function validateLoginForm(form) {
  const errors = {
    email: validateEmail(form.email),
    password: validatePassword(form.password)
  };

  return {
    errors,
    payload: {
      email: normalizeSingleLine(form.email).toLowerCase(),
      password: String(form.password || "").trim()
    }
  };
}

export function validateUserForm(form) {
  const errors = {
    fullName: validateFullName(form.fullName),
    email: validateEmail(form.email),
    password: validatePassword(form.password),
    role: form.role ? "" : "Role is required."
  };

  return {
    errors,
    payload: {
      fullName: normalizeSingleLine(form.fullName),
      email: normalizeSingleLine(form.email).toLowerCase(),
      password: String(form.password || "").trim(),
      role: form.role
    }
  };
}

export function validateTaskForm(form) {
  const errors = {
    title: validateTaskTitle(form.title),
    description: validateTaskDescription(form.description)
  };

  return {
    errors,
    payload: {
      title: normalizeSingleLine(form.title),
      description: normalizeMultiline(form.description),
      status: form.status,
      assignedTo: form.assignedTo ? Number(form.assignedTo) : null
    }
  };
}

export function hasErrors(errors) {
  return Object.values(errors).some(Boolean);
}
