// test/routes/categoryRoutes.test.js

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock your Category model and associated Joi schemas
const Category = require('../../models/Category'); // Real Mongoose model
const { createCategorySchema } = require('../../validators/category/createCategorySchema');
const { updateCategorySchema } = require('../../validators/category/updateCategorySchema');

// Mock your middleware
jest.mock('../../middleware/validateData', () => ({
  validateData: jest.fn((schema) => (req, res, next) => {
    // A simplified mock of validateData that directly uses Joi validateAsync
    // For a real integration test, you might mock it to just call next()
    // if req.body is valid or throw an error to simulate validation failure.
    // For now, let's pass a simplified version:
    try {
      schema.validateSync(req.body, { abortEarly: false, allowUnknown: true, stripUnknown: true });
      next();
    } catch (e) {
      res.status(400).json({ message: "Validation failed", errors: e.details });
    }
  }),
}));

jest.mock('../../middleware/isAuthenticated', () => ({
  isAuthenticated: jest.fn((req, res, next) => {
    // Simulate a logged-in user for authenticated routes
    req.user = { _id: new mongoose.Types.ObjectId(), email: 'test@example.com' }; // Mock user object
    next();
  }),
}));

// Mock your controllers (important for isolating route tests from controller logic)
const categoryController = {
  getCategories: jest.fn((req, res) => res.status(200).json({ success: true, count: 0, data: [] })),
  getCategoryById: jest.fn((req, res) => res.status(200).json({ success: true, data: { _id: req.params.id, name: 'Mock Category' } })),
  createCategory: jest.fn((req, res) => res.status(201).json({ success: true, data: { _id: new mongoose.Types.ObjectId(), ...req.body } })),
  updateCategoryById: jest.fn((req, res) => res.status(200).json({ success: true, data: { _id: req.params.id, ...req.body } })),
  deleteCategoryById: jest.fn((req, res) => res.status(200).json({ success: true, acknowledged: true, deletedCount: 1 })),
};

// Import the actual router, but ensure it uses the mocked controllers and middleware
const categoryRoutes = require('../../routes/categoryRoutes'); // Your actual router file

// Create a simple Express app to test the router
const app = express();
app.use(express.json()); // Body parser
app.use('/categories', categoryRoutes);

let mongoServer;

describe('Category Routes', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterEach(async () => {
    // Clear mocks after each test
    jest.clearAllMocks();
    // Clear the database or specific collections if needed for more isolated controller tests
    await Category.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // --- GET /categories ---
  describe('GET /categories', () => {
    test('should call isAuthenticated and getCategories controller', async () => {
      await request(app).get('/categories');

      expect(categoryController.getCategories).toHaveBeenCalledTimes(1);
      expect(require('../../middleware/isAuthenticated').isAuthenticated).toHaveBeenCalledTimes(1);
    });

    test('should return 200 and a list of categories', async () => {
      // Mock the controller to return actual data for this test
      categoryController.getCategories.mockImplementationOnce((req, res) => {
        res.status(200).json({ success: true, count: 1, data: [{ _id: 'mockId1', name: 'Test Cat' }] });
      });

      const res = await request(app).get('/categories');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // --- GET /categories/:id ---
  describe('GET /categories/:id', () => {
    test('should call getCategoryById controller', async () => {
      const categoryId = new mongoose.Types.ObjectId().toString();
      await request(app).get(`/categories/${categoryId}`);

      expect(categoryController.getCategoryById).toHaveBeenCalledTimes(1);
      expect(categoryController.getCategoryById).toHaveBeenCalledWith(
        expect.any(Object), // req
        expect.any(Object), // res
        expect.any(Function) // next
      );
      expect(categoryController.getCategoryById.mock.calls[0][0].params.id).toBe(categoryId);
    });

    test('should return 200 and category data for a valid ID', async () => {
      const categoryId = new mongoose.Types.ObjectId().toString();
      categoryController.getCategoryById.mockImplementationOnce((req, res) => {
        res.status(200).json({ success: true, data: { _id: req.params.id, name: 'Found Category' } });
      });

      const res = await request(app).get(`/categories/${categoryId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(categoryId);
      expect(res.body.data.name).toBe('Found Category');
    });
  });

  // --- POST /categories ---
  describe('POST /categories', () => {
    test('should call validateData and createCategory controller for valid data', async () => {
      const newCategory = { name: 'New Category', description: 'Description for new category' };

      await request(app)
        .post('/categories')
        .send(newCategory);

      // ValidateData should be called with the correct schema
      expect(require('../../middleware/validateData').validateData).toHaveBeenCalledWith(createCategorySchema);
      // Controller should be called
      expect(categoryController.createCategory).toHaveBeenCalledTimes(1);
      // Check if controller received the data
      expect(categoryController.createCategory.mock.calls[0][0].body).toEqual(newCategory);
    });

    test('should return 201 and created category data for valid input', async () => {
      const newCategory = { name: 'Valid Cat', description: 'Desc' };
      categoryController.createCategory.mockImplementationOnce((req, res) => {
        res.status(201).json({ success: true, data: { _id: new mongoose.Types.ObjectId(), ...req.body } });
      });

      const res = await request(app)
        .post('/categories')
        .send(newCategory);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject(newCategory);
      expect(res.body.data._id).toBeDefined();
    });

    test('should return 400 for invalid data', async () => {
      const invalidCategory = { name: 123, description: 'Desc' }; // Invalid name type

      // Here, our mock validateData will handle the validation error
      const res = await request(app)
        .post('/categories')
        .send(invalidCategory);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Validation failed");
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain('"name" must be a string');
      expect(categoryController.createCategory).not.toHaveBeenCalled(); // Controller should not be called
    });
  });

  // --- PUT /categories/:id ---
  describe('PUT /categories/:id', () => {
    test('should call validateData and updateCategoryById controller for valid data', async () => {
      const categoryId = new mongoose.Types.ObjectId().toString();
      const updatedData = { name: 'Updated Name', description: 'Updated Desc' };

      await request(app)
        .put(`/categories/${categoryId}`)
        .send(updatedData);

      expect(require('../../middleware/validateData').validateData).toHaveBeenCalledWith(updateCategorySchema);
      expect(categoryController.updateCategoryById).toHaveBeenCalledTimes(1);
      expect(categoryController.updateCategoryById.mock.calls[0][0].params.id).toBe(categoryId);
      expect(categoryController.updateCategoryById.mock.calls[0][0].body).toEqual(updatedData);
    });

    test('should return 200 and updated category data for valid input', async () => {
      const categoryId = new mongoose.Types.ObjectId().toString();
      const updatedData = { name: 'Updated', description: 'New Description' };
      categoryController.updateCategoryById.mockImplementationOnce((req, res) => {
        res.status(200).json({ success: true, data: { _id: req.params.id, ...req.body } });
      });

      const res = await request(app)
        .put(`/categories/${categoryId}`)
        .send(updatedData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(categoryId);
      expect(res.body.data).toMatchObject(updatedData);
    });

    test('should return 400 for invalid update data', async () => {
      const categoryId = new mongoose.Types.ObjectId().toString();
      const invalidData = { name: 123, description: 'Desc' }; // Invalid type

      const res = await request(app)
        .put(`/categories/${categoryId}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Validation failed");
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain('"name" must be a string');
      expect(categoryController.updateCategoryById).not.toHaveBeenCalled();
    });
  });

  // --- DELETE /categories/:id ---
  describe('DELETE /categories/:id', () => {
    test('should call isAuthenticated and deleteCategoryById controller', async () => {
      const categoryId = new mongoose.Types.ObjectId().toString();
      await request(app).delete(`/categories/${categoryId}`);

      expect(require('../../middleware/isAuthenticated').isAuthenticated).toHaveBeenCalledTimes(1);
      expect(categoryController.deleteCategoryById).toHaveBeenCalledTimes(1);
      expect(categoryController.deleteCategoryById.mock.calls[0][0].params.id).toBe(categoryId);
    });

    test('should return 200 for successful deletion', async () => {
      const categoryId = new mongoose.Types.ObjectId().toString();
      categoryController.deleteCategoryById.mockImplementationOnce((req, res) => {
        res.status(200).json({ success: true, acknowledged: true, deletedCount: 1 });
      });

      const res = await request(app).delete(`/categories/${categoryId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.acknowledged).toBe(true);
      expect(res.body.deletedCount).toBe(1);
    });
  });
});