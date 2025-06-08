const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Something went wrong on the server.';

    // Handle specific Mongoose errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    } else if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        message = `Resource not found with ID of ${err.value}`;
    } else if (err.code === 11000) { // Duplicate key error
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate field value: ${field} already exists.`;
    }

    res.status(statusCode).json({
        success: false,
        error: message,
    });
};

module.exports = errorHandler;