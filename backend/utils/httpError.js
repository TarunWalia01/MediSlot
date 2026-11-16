export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function sendControllerError(error, response, resourceName) {
  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  if (error.code === 11000) {
    return response.status(409).json({
      success: false,
      message: 'A record with the same unique key already exists.'
    });
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return response.status(400).json({
      success: false,
      message: error.message
    });
  }

  console.error(`${resourceName} request failed:`, error.message);
  return response.status(500).json({
    success: false,
    message: `Unable to complete the ${resourceName} request right now.`
  });
}
