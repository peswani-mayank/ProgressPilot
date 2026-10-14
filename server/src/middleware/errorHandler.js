export const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      error: 'Validation Error',
      details: messages,
    });
  }

  // Mongoose cast error (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid Identifier',
      message: `Invalid format for field: ${err.path}`,
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || {});
    return res.status(409).json({
      error: 'Duplicate Resource',
      message: `A record with this ${fields.join(', ')} already exists.`,
    });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: err.name || 'Server Error',
    message: err.message || 'An unexpected error occurred on the server.',
  });
};
