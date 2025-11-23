const Joi = require('joi');

const createSchema = Joi.object({
  title: Joi.string().trim().min(1).required(),
  author: Joi.string().trim().min(1).required(),
  available: Joi.boolean().optional(),
  borrower: Joi.string().allow('', null),
  borrowedAt: Joi.date().optional()
});

module.exports = {
  validateCreate: (body) => createSchema.validate(body)
};