const Flower = require("../models/Flower");
const Category = require("../models/Category");

/**
 * @desc    Get all flowers
 * @route   GET /flowers
 * @access  Public
 * @param   {object} req.query - Optional query parameters for filtering (category, search, minPrice, maxPrice, isFeatured)
 */
const getFlowers = async (req, res, next) => {
  try {
    const query = {};
    const { category, search, minPrice, maxPrice, isFeatured } = req.query;

    if (category) {
      query.category = category; // Assumes category is a valid ObjectId
    }

    if (search) {
      query.name = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (isFeatured) {
      query.isFeatured = isFeatured === "true"; // Convert string to boolean
    }

    const flowers = await Flower.find(query).populate("category"); // Populate category details
    res.status(200).json({
      success: true,
      count: flowers.length,
      data: flowers,
    });
  } catch (err) {
    next(err); // Pass error to centralized error handler
  }
};

/**
 * @desc    Get single flower by ID
 * @route   GET /flowers/:id
 * @access  Public
 */
const getFlowerById = async (req, res, next) => {
  try {
    // Use populate to fetch details of the referenced category
    const flower = await Flower.findById(req.params.id).populate("category");

    if (!flower) {
      const error = new Error(`Flower not found with ID of ${req.params.id}`);
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: flower,
    });
  } catch (err) {
    next(err); // Pass error to centralized error handler
  }
};

/**
 * @desc    Create a new flower
 * @route   POST /flowers
 * @access  Public
 */
const createFlower = async (req, res, next) => {
  try {
    const body = req.body;
    const categoryId = body.categoryId;
    const category = await Category.findById(categoryId);

    if (!category) {
      // If category not found, create a custom error object for the error handler
      const error = new Error(`Category not found with ID of ${req.params.id}`);
      error.statusCode = 404;
      return next(error);
    }

    const newFlower = await new Flower({
      name: body.name,
      description: body.description,
      price: body.price,
      category,
      imageUrl: body.imageUrl,
      stock: body.stock,
      isFeatured: body.isFeatured,
    }).save();

    res.json(newFlower);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a flower by ID
 * @route   PUT /flowers/:id
 * @access  Public
 */
const updateFlowerById = async (req, res, next) => {
  const flowerId = req.params.id;
  const body = req.body;
  console.log("===>",flowerId)

  try {
    const flower = await Flower.findById(flowerId);
    if (!flower) {
      const error = new Error(`Flower not found with ID of ${flowerId}`);
      error.statusCode = 404;
      return next(error);
    }
  
    const updateFlower = await Flower.findByIdAndUpdate(flowerId, body, {
      new: true,
    });

    res.json(updateFlower);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a flower by ID
 * @route   DELETE /flowers/:id
 * @access  Public
 */
const deleteFlowerById = async (req, res, next) => {
  const flowerId = req.params.id;

  try {
    const deleteFlower = await Flower.deleteOne({ _id: flowerId });
    res.json(deleteFlower);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFlowers,
  getFlowerById,
  createFlower,
  updateFlowerById,
  deleteFlowerById,
};
