/**
 * Global Express error handler.
 * Must keep the 4-arg signature (err, req, res, next) — Express only
 * invokes handlers with this arity for errors passed to next(err).
 * Logs the error and responds with a 500 JSON payload; if headers are
 * already sent, delegates to the default Express error handler instead.
 */
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
  }

  console.log(err);
  res.status(500).json({ error: err.message });
};

export default errorHandler;
