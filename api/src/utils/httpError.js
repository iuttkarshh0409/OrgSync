function httpError(statusCode, message, name = "HttpError") {
  const error = new Error(message);
  error.name = name;
  error.statusCode = statusCode;
  return error;
}

module.exports = { httpError };
