export const errorHandler = (logger) => (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.body?.metadata?.requestId,
  });

  res.status(statusCode).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
  });
};
