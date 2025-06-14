const joi = require("joi");

const createFlowerSchema = joi.object({
  name: joi.string().required(),
  description: joi.string().optional(),
  price: joi.number().required(),
  category: joi.string().required(),
  imageUrl: joi.string().required(),
  stock: joi.number().required(),
  isFeatured: joi.boolean().required(),
});

module.exports = { createFlowerSchema };
