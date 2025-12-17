const Joi = require('joi');
const mongoSanitize = require('express-mongo-sanitize');

// Validation middleware wrapper
const validate = (schema) => {
  return (req, res, next) => {
    // Sanitize inputs to prevent NoSQL injection
    req.body = mongoSanitize.sanitize(req.body);
    req.query = mongoSanitize.sanitize(req.query);
    req.params = mongoSanitize.sanitize(req.params);

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

// Custom option schema
const customOptionSchema = Joi.object({
  name: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Option name is required',
    }),
  type: Joi.string()
    .valid('select', 'text', 'color', 'number')
    .required()
    .messages({
      'any.only': 'Option type must be one of: select, text, color, number',
      'string.empty': 'Option type is required',
    }),
  options: Joi.array()
    .items(Joi.string().trim())
    .when('type', {
      is: Joi.valid('select', 'color'),
      then: Joi.required().min(1),
      otherwise: Joi.optional(),
    })
    .messages({
      'array.min': 'At least one option is required for select/color types',
    }),
  priceModifier: Joi.number()
    .default(0)
    .messages({
      'number.base': 'Price modifier must be a number',
    }),
});

// Create product validation schema
const createProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Product name is required',
      'string.min': 'Product name must be at least 3 characters',
      'string.max': 'Product name cannot exceed 100 characters',
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
    .items(Joi.string().uri())
    .min(1)
    .required()
    .messages({
      'array.base': 'Images must be an array',
      'array.min': 'At least one image is required',
      'string.uri': 'Each image must be a valid URL',
      'any.required': 'Images are required',
    }),
  
  customOptions: Joi.array()
    .items(customOptionSchema)
    .default([])
    .messages({
      'array.base': 'Custom options must be an array',
    }),
  
  description: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 2000 characters',
    }),
  
  category: Joi.string()
    .valid('tote', 'sling', 'clutch', 'backpack', 'crossbody')
    .lowercase()
    .required()
    .messages({
      'any.only': 'Category must be one of: tote, sling, clutch, backpack, crossbody',
      'string.empty': 'Category is required',
    }),
  
  featured: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Featured must be a boolean',
    }),
});

// Update product validation schema (all fields optional)
const updateProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .messages({
      'string.min': 'Product name must be at least 3 characters',
      'string.max': 'Product name cannot exceed 100 characters',
    }),
  
  basePrice: Joi.number()
    .min(0)
    .messages({
      'number.base': 'Base price must be a number',
      'number.min': 'Base price cannot be negative',
    }),
  
  images: Joi.array()
    .items(Joi.string().uri())
    .min(1)
    .messages({
      'array.min': 'At least one image is required',
      'string.uri': 'Each image must be a valid URL',
    }),
  
  customOptions: Joi.array()
    .items(customOptionSchema)
    .messages({
      'array.base': 'Custom options must be an array',
    }),
  
  description: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 2000 characters',
    }),
  
  category: Joi.string()
    .valid('tote', 'sling', 'clutch', 'backpack', 'crossbody')
    .lowercase()
    .messages({
      'any.only': 'Category must be one of: tote, sling, clutch, backpack, crossbody',
    }),
  
  featured: Joi.boolean()
    .messages({
      'boolean.base': 'Featured must be a boolean',
    }),
}).min(1); // At least one field must be present

// Query validation for filtering
const queryValidation = (req, res, next) => {
  const querySchema = Joi.object({
    category: Joi.string()
      .valid('tote', 'sling', 'clutch', 'backpack', 'crossbody')
      .lowercase(),
    featured: Joi.string()
      .valid('true', 'false'),
    search: Joi.string()
      .trim()
      .max(100),
    minPrice: Joi.number()
      .min(0),
    maxPrice: Joi.number()
      .min(0),
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(12),
    sort: Joi.string()
      .valid('createdAt', '-createdAt', 'basePrice', '-basePrice', 'name', '-name')
      .default('-createdAt'),
  }).unknown(false);

  // Sanitize query params
  req.query = mongoSanitize.sanitize(req.query);

  const { error, value } = querySchema.validate(req.query);

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

module.exports = {
  validateCreateProduct: validate(createProductSchema),
  validateUpdateProduct: validate(updateProductSchema),
  validateQuery: queryValidation,
};