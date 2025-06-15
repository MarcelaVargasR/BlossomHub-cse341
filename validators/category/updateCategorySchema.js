const joi = require("joi");

const updateCategorySchema = joi.object({
  name: joi.string().required(),
  description: joi.string().optional(),
});

module.exports = { updateCategorySchema };
