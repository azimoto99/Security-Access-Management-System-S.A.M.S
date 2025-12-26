import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.reduce(
        (acc, detail) => {
          acc[detail.path.join('.')] = detail.message;
          return acc;
        },
        {} as Record<string, string>
      );

      const validationError: AppError = new Error('Validation error');
      validationError.statusCode = 400;
      validationError.code = 'VALIDATION_ERROR';
      validationError.details = details;
      return next(validationError);
    }

    req.body = value;
    next();
  };
};
















