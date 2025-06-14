const joi = require("joi");

const createCategorySchema = joi.object({
  name: joi.string().required(),
  description: joi.string().optional(),
});

module.export = { createCategorySchema };
