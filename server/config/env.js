const Joi = require('joi');
require('dotenv').config();

// Define environment validation schema
const envSchema = Joi.object({
  // Server Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number()
    .port()
    .default(5000),
  
  // Database Configuration
  MONGODB_URI: Joi.string()
    .uri()
    .required()
    .description('MongoDB Atlas connection string'),
  
  // JWT Configuration
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT secret key (min 32 characters)'),
  JWT_EXPIRE: Joi.string()
    .default('7d')
    .description('JWT expiration time'),
  JWT_COOKIE_EXPIRE: Joi.number()
    .default(7)
    .description('JWT cookie expiration in days'),
  
  // Paystack Configuration
  PAYSTACK_SECRET_KEY: Joi.string()
    .required()
    .description('Paystack secret key'),
  PAYSTACK_PUBLIC_KEY: Joi.string()
    .required()
    .description('Paystack public key'),
  
  // CORS Configuration
  CLIENT_URL: Joi.string()
    .uri()
    .required()
    .description('Frontend URL for CORS'),
  
  // Email Configuration (Optional for development)
  EMAIL_HOST: Joi.string()
    .allow('', null)
    .optional(),
  EMAIL_PORT: Joi.number()
    .port()
    .default(587),
  EMAIL_USER: Joi.string()
    .allow('', null)
    .optional(),
  EMAIL_PASSWORD: Joi.string()
    .allow('', null)
    .optional(),
  EMAIL_FROM: Joi.string()
    .email()
    .default('noreply@handmadebags.ng'),
  
  // Cloudinary Configuration (for image uploads)
  CLOUDINARY_CLOUD_NAME: Joi.string()
    .required()
    .description('Cloudinary cloud name'),
  CLOUDINARY_API_KEY: Joi.string()
    .required()
    .description('Cloudinary API key'),
  CLOUDINARY_API_SECRET: Joi.string()
    .required()
    .description('Cloudinary API secret'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .default(900000)
    .description('Rate limit window in milliseconds (default: 15 minutes)'),
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .default(100)
    .description('Max requests per window per IP'),
})
  .unknown()
  .required();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error('Environment validation error: ' + error.message);
}

// Export validated environment variables
module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URI,
    options: {
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 5,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expire: envVars.JWT_EXPIRE,
    cookieExpire: envVars.JWT_COOKIE_EXPIRE,
  },
  paystack: {
    secretKey: envVars.PAYSTACK_SECRET_KEY,
    publicKey: envVars.PAYSTACK_PUBLIC_KEY,
  },
  cors: {
    origin: envVars.CLIENT_URL,
  },
  email: {
    host: envVars.EMAIL_HOST,
    port: envVars.EMAIL_PORT,
    user: envVars.EMAIL_USER,
    password: envVars.EMAIL_PASSWORD,
    from: envVars.EMAIL_FROM,
  },
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
};