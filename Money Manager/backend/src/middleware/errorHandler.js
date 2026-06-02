export function errorHandler(err, _req, res, _next) {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && err.details ? { details: err.details } : {}),
  })
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export function httpError(status, message, details) {
  const e = new Error(message)
  e.status = status
  if (details) e.details = details
  return e
}
