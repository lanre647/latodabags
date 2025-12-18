const Joi = require('joi');
const mongoSanitize = require('express-mongo-sanitize');

// Validation middleware wrapper
const validate = (schema) => {
  return (req, res, next) => {
    // Sanitize inputs to prevent NoSQL injection
    if (req.body) {
      req.body = mongoSanitize.sanitize(req.body);
    }
    if (req.query) {
      req.query = mongoSanitize.sanitize(req.query);
    }
    if (req.params) {
      req.params = mongoSanitize.sanitize(req.params);
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    req.body = value;
    next();
  };
};

// Validate query parameters
const validateQueryParams = (schema) => {
  return (req, res, next) => {
    if (req.query) {
      req.query = mongoSanitize.sanitize(req.query);
    }

    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors,
      });
    }

    req.query = value;
    next();
  };
};

// Custom specification schema
const customSpecSchema = Joi.object({
  name: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Specification name is required',
    }),
  value: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Specification value is required',
    }),
  priceAdjustment: Joi.number()
    .default(0)
    .messages({
      'number.base': 'Price adjustment must be a number',
    }),
});

// Create custom order validation schema
const createCustomOrderSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Order title is required',
      'string.min': 'Order title must be at least 3 characters',
      'string.max': 'Order title cannot exceed 100 characters',
    }),

  description: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 1000 characters',
    }),

  customSpecs: Joi.array()
    .items(customSpecSchema)
    .optional()
    .messages({
      'array.base': 'Custom specifications must be an array',
    }),

  basePrice: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Base price must be a number',
      'number.min': 'Base price cannot be negative',
      'any.required': 'Base price is required',
    }),

  images: Joi.array()
    .items(Joi.string().trim())
    .optional()
    .messages({
      'array.base': 'Images must be an array',
    }),

  deadline: Joi.date()
    .min('now')
    .optional()
    .messages({
      'date.base': 'Deadline must be a valid date',
      'date.min': 'Deadline must be in the future',
    }),
});

// Update order status validation schema
const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be one of: pending, processing, shipped, delivered, cancelled',
    }),

  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Notes cannot exceed 500 characters',
    }),
});

// Query validation schema
const querySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least 1',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),

  status: Joi.string()
    .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    .optional()
    .messages({
      'any.only': 'Status must be one of: pending, processing, shipped, delivered, cancelled',
    }),

  sort: Joi.string()
    .trim()
    .optional()
    .messages({
      'string.base': 'Sort must be a string',
    }),
});

module.exports = {
  validateCreateCustomOrder: validate(createCustomOrderSchema),
  validateUpdateOrderStatus: validate(updateOrderStatusSchema),
  validateQuery: validateQueryParams(querySchema),
};
