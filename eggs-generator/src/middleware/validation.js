export const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const validationErrors = error.details.map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationErrors,
    });
  }

  next();
};
