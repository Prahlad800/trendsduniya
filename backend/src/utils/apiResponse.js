export const success = (res, data, message = "Success", status = 200, pagination) =>
  res.status(status).json({ success: true, message, data, ...(pagination ? { pagination } : {}) });

export const failure = (res, message, status = 500, errors) =>
  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });

export class AppError extends Error {
  constructor(message, statusCode = 500, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
