function validateRequest({ body, params } = {}) {
  return (req, _res, next) => {
    try {
      if (typeof body === "function") {
        req.body = body(req.body, req);
      }

      if (typeof params === "function") {
        req.validatedParams = params(req.params, req);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { validateRequest };
