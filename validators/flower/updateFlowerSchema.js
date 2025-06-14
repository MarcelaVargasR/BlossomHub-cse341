const joi = require("joi");

const updateFlowerSchema = joi.object({
  name: joi.string().optional(),
  description: joi.string().optional(),
  price: joi.number().optional(),
  category: joi.string().optional(),
  image: joi.string().optional(),
  stock: joi.number().optional(),
  isFeatured: joi.boolean().optional(),
});

module.exports = { updateFlowerSchema };
