import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Define environment variable schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),

  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // File Upload
  UPLOAD_DIR: Joi.string().default('./uploads'),
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB

  // DocuSign (for HR documents)
  DOCUSIGN_INTEGRATION_KEY: Joi.string().optional(),
  DOCUSIGN_USER_ID: Joi.string().optional(),
  DOCUSIGN_ACCOUNT_ID: Joi.string().optional(),
  DOCUSIGN_RSA_PRIVATE_KEY: Joi.string().optional(),
  DOCUSIGN_API_BASE_PATH: Joi.string().default('https://demo.docusign.net/restapi'),
  DOCUSIGN_WEBHOOK_SECRET: Joi.string().optional(),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  cors: {
    origin: envVars.CORS_ORIGIN,
  },
  db: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    name: envVars.DB_NAME,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
  },
  upload: {
    dir: envVars.UPLOAD_DIR,
    maxFileSize: envVars.MAX_FILE_SIZE,
  },
  docusign: {
    integrationKey: envVars.DOCUSIGN_INTEGRATION_KEY,
    userId: envVars.DOCUSIGN_USER_ID,
    accountId: envVars.DOCUSIGN_ACCOUNT_ID,
    rsaPrivateKey: envVars.DOCUSIGN_RSA_PRIVATE_KEY,
    apiBasePath: envVars.DOCUSIGN_API_BASE_PATH,
    webhookSecret: envVars.DOCUSIGN_WEBHOOK_SECRET,
  },
};



