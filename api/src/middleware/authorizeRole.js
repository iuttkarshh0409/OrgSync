const { httpError } = require("../utils/httpError");

function authorizeRole(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(httpError(403, "Forbidden"));
    }

    return next();
  };
}

module.exports = { authorizeRole };
