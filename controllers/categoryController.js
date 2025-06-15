const Category = require("../models/Category");

/**
* @desc    Get all categories
* @route   GET /categories
* @access  Public
*/
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    next(err); // Pass error to centralized error handler
  }
};


/**
* @desc    Get single category by ID
* @route   GET /categories/:id
* @access  Public
*/
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      // If category not found, create a custom error object for the error handler
      const error = new Error(`Category not found with ID of ${req.params.id}`);
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (err) {
    // If ID format is invalid (e.g., not a valid ObjectId), Mongoose will throw a CastError
    next(err); // Pass error to centralized error handler
  }
};


/**
* @desc    Create a new category
* @route   POST /categories
* @access  Public
*/
const createCategory = async (req, res, next) => {
  try {
    const body = req.body;
    const newCategory = await new Category({
      name: body.name,
      description: body.description,
      createAt: body.createAt,
    }).save();

    res.json(newCategory);

  } catch (error) {
    console.log("🚀 ~ createCategory ~ error:", error)
    
    next(error);
  }
};



/**
* @desc    Update a category by ID
* @route   PUT /categories/:id
* @access  Public
*/
const updateCategoryById = async (req, res, next) => {
  const categoryId = req.params.id;
  const body = req.body;

  try {
    const updateCategory = await Category.findByIdAndUpdate(categoryId, body, {
      new: true,
    });

    res.json(updateCategory);

  } catch (error) {
    next(error);
  }
};



/**
* @desc    Delete a category by ID
* @route   DELETE /categories/:id
* @access  Public
*/
const deleteCategoryById = async (req, res, next) => {
  const categoryId = req.params.id;

  try {
    const deleteCategory = await Category.deleteOne({ _id: categoryId });
    res.json(deleteCategory)

  } catch (error) {
    next(error);
  }
};




module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategoryById,
  deleteCategoryById
};
 