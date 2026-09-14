const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
  }

  console.log(err);
  res.status(500).json({ error: err.message });
};

export default errorHandler;
