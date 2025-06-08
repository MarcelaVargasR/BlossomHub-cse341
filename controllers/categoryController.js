const Category = require("../models/Category");

/**
 * @desc    Get all categories
 * @route   GET /categories
 * @access  Public
 */
const getCategories = async (req, res, next) => {};

/**
 * @desc    Get single category by ID
 * @route   GET /categories/:id
 * @access  Public
 */
const getCategoryById = async (req, res, next) => {};

/**
 * @desc    Create a new category
 * @route   POST /categories
 * @access  Public
 */
const createCategory = async (req, res, next) => {};

/**
 * @desc    Update a category by ID
 * @route   PUT /categories/:id
 * @access  Public
 */
const updateCategoryById = async (req, res, next) => {};

/**
 * @desc    Delete a category by ID
 * @route   DELETE /categories/:id
 * @access  Public
 */
const deleteCategoryById = async (req, res, next) => {};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
};
