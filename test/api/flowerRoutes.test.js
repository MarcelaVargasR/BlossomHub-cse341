// test/routes/flowerRoutes.test.js

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock your Flower model and associated Joi schemas
const Flower = require('../../models/Flower'); // Real Mongoose model (for potential DB interactions, even if mocked)
const { createFlowerSchema } = require('../../validators/flower/createFlowerSchema');
const { updateFlowerSchema } = require('../../validators/flower/updateFlowerSchema');

// Mock your middleware
jest.mock('../../middleware/validateData', () => ({
  validateData: jest.fn((schema) => (req, res, next) => {
    try {
      // Use the actual Joi schema to validate, but capture the error for our mock response
      schema.validateSync(req.body, { abortEarly: false, allowUnknown: true, stripUnknown: true });
      next(); // Validation passed
    } catch (e) {
      res.status(400).json({ message: "Validation failed", errors: e.details });
    }
  }),
}));

jest.mock('../../middleware/isAuthenticated', () => ({
  isAuthenticated: jest.fn((req, res, next) => {
    req.user = { _id: new mongoose.Types.ObjectId(), email: 'test@example.com' }; // Simulate a logged-in user
    next();
  }),
}));

// Mock your controllers
const flowerController = {
  getFlowers: jest.fn((req, res) => res.status(200).json({ success: true, count: 0, data: [] })),
  getFlowerById: jest.fn((req, res) => res.status(200).json({ success: true, data: { _id: req.params.id, name: 'Mock Flower' } })),
  createFlower: jest.fn((req, res) => res.status(201).json({ success: true, data: { _id: new mongoose.Types.ObjectId(), ...req.body } })),
  updateFlowerById: jest.fn((req, res) => res.status(200).json({ success: true, data: { _id: req.params.id, ...req.body } })),
  deleteFlowerById: jest.fn((req, res) => res.status(200).json({ success: true, acknowledged: true, deletedCount: 1 })),
};

// Import the actual router, but ensure it uses the mocked controllers and middleware
const flowerRoutes = require('../../routes/flowerRoutes');

// Create a simple Express app to test the router
const app = express();
app.use(express.json());
app.use('/flowers', flowerRoutes);

let mongoServer;

describe('Flower Routes', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await Flower.deleteMany({}); // Clear collection after each test
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Helper for valid flower data (requires a mock category ID)
  const mockCategoryId = new mongoose.Types.ObjectId();
  const createValidFlowerData = () => ({
    name: 'Rose',
    description: 'A beautiful red rose',
    price: 25.00,
    categoryId: mockCategoryId.toString(), // Use mock category ID
    stock: 100,
    isFeatured: false,
    imageUrl: 'http://example.com/rose.jpg'
  });

  // --- GET /flowers ---
  describe('GET /flowers', () => {
    test('should call isAuthenticated and getFlowers controller', async () => {
      await request(app).get('/flowers');
      expect(require('../../middleware/isAuthenticated').isAuthenticated).toHaveBeenCalledTimes(1);
      expect(flowerController.getFlowers).toHaveBeenCalledTimes(1);
    });

    test('should return 200 and a list of flowers', async () => {
      flowerController.getFlowers.mockImplementationOnce((req, res) => {
        res.status(200).json({ success: true, count: 1, data: [{ _id: 'mockId1', name: 'Test Flower' }] });
      });

      const res = await request(app).get('/flowers');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('should pass query parameters to getFlowers controller', async () => {
      const queryParams = '?category=someCatId&search=lily&minPrice=10&maxPrice=50&isFeatured=true';
      await request(app).get(`/flowers${queryParams}`);

      expect(flowerController.getFlowers).toHaveBeenCalledTimes(1);
      // Check if the request object passed to controller contains correct query
      const req = flowerController.getFlowers.mock.calls[0][0];
      expect(req.query.category).toBe('someCatId');
      expect(req.query.search).toBe('lily');
      expect(req.query.minPrice).toBe('10'); // Query params are strings
      expect(req.query.maxPrice).toBe('50');
      expect(req.query.isFeatured).toBe('true');
    });
  });

  // --- GET /flowers/:id ---
  describe('GET /flowers/:id', () => {
    test('should call getFlowerById controller', async () => {
      const flowerId = new mongoose.Types.ObjectId().toString();
      await request(app).get(`/flowers/${flowerId}`);
      expect(flowerController.getFlowerById).toHaveBeenCalledTimes(1);
      expect(flowerController.getFlowerById.mock.calls[0][0].params.id).toBe(flowerId);
    });

    test('should return 200 and flower data for a valid ID', async () => {
      const flowerId = new mongoose.Types.ObjectId().toString();
      flowerController.getFlowerById.mockImplementationOnce((req, res) => {
        res.status(200).json({ success: true, data: { _id: req.params.id, name: 'Found Flower', price: 10 } });
      });

      const res = await request(app).get(`/flowers/${flowerId}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(flowerId);
      expect(res.body.data.name).toBe('Found Flower');
    });
  });

  // --- POST /flowers ---
  describe('POST /flowers', () => {
    test('should call validateData and createFlower controller for valid data', async () => {
      const newFlower = createValidFlowerData();

      await request(app)
        .post('/flowers')
        .send(newFlower);

      expect(require('../../middleware/validateData').validateData).toHaveBeenCalledWith(createFlowerSchema);
      expect(flowerController.createFlower).toHaveBeenCalledTimes(1);
      expect(flowerController.createFlower.mock.calls[0][0].body).toEqual(newFlower);
    });

    test('should return 201 and created flower data for valid input', async () => {
      const newFlower = createValidFlowerData();
      flowerController.createFlower.mockImplementationOnce((req, res) => {
        res.status(201).json({ success: true, data: { _id: new mongoose.Types.ObjectId(), ...req.body } });
      });

      const res = await request(app)
        .post('/flowers')
        .send(newFlower);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject(newFlower);
      expect(res.body.data._id).toBeDefined();
    });

    test('should return 400 for invalid data', async () => {
      const invalidFlower = { ...createValidFlowerData(), price: 'not-a-number' }; // Invalid price type

      const res = await request(app)
        .post('/flowers')
        .send(invalidFlower);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Validation failed");
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain('"price" must be a number');
      expect(flowerController.createFlower).not.toHaveBeenCalled(); // Controller should not be called
    });

    test('should return 400 if required fields are missing', async () => {
      const incompleteFlower = { name: 'Incomplete' }; // Missing price, categoryId, stock

      const res = await request(app)
        .post('/flowers')
        .send(incompleteFlower);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Validation failed");
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.some(e => e.message.includes('"price" is required'))).toBe(true);
      expect(res.body.errors.some(e => e.message.includes('"categoryId" is required'))).toBe(true);
      expect(res.body.errors.some(e => e.message.includes('"stock" is required'))).toBe(true);
      expect(flowerController.createFlower).not.toHaveBeenCalled();
    });
  });

  // --- PUT /flowers/:id ---
  describe('PUT /flowers/:id', () => {
    test('should call validateData and updateFlowerById controller for valid data', async () => {
      const flowerId = new mongoose.Types.ObjectId().toString();
      const updatedData = { name: 'Updated Flower', price: 30.00, stock: 90 };

      await request(app)
        .put(`/flowers/${flowerId}`)
        .send(updatedData);

      expect(require('../../middleware/validateData').validateData).toHaveBeenCalledWith(updateFlowerSchema);
      expect(flowerController.updateFlowerById).toHaveBeenCalledTimes(1);
      expect(flowerController.updateFlowerById.mock.calls[0][0].params.id).toBe(flowerId);
      expect(flowerController.updateFlowerById.mock.calls[0][0].body).toEqual(updatedData);
    });

    test('should return 200 and updated flower data for valid input', async () => {
      const flowerId = new mongoose.Types.ObjectId().toString();
      const updatedData = { name: 'Updated Name', price: 15.99 };
      flowerController.updateFlowerById.mockImplementationOnce((req, res) => {
        res.status(200).json({ success: true, data: { _id: req.params.id, ...req.body } });
      });

      const res = await request(app)
        .put(`/flowers/${flowerId}`)
        .send(updatedData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(flowerId);
      expect(res.body.data).toMatchObject(updatedData);
    });

    test('should return 400 for invalid update data', async () => {
      const flowerId = new mongoose.Types.ObjectId().toString();
      const invalidData = { price: 'invalid' }; // Invalid type

      const res = await request(app)
        .put(`/flowers/${flowerId}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Validation failed");
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain('"price" must be a number');
      expect(flowerController.updateFlowerById).not.toHaveBeenCalled();
    });
  });

  // --- DELETE /flowers/:id ---
  describe('DELETE /flowers/:id', () => {
    test('should call isAuthenticated and deleteFlowerById controller', async () => {
      const flowerId = new mongoose.Types.ObjectId().toString();
      await request(app).delete(`/flowers/${flowerId}`);

      expect(require('../../middleware/isAuthenticated').isAuthenticated).toHaveBeenCalledTimes(1);
      expect(flowerController.deleteFlowerById).toHaveBeenCalledTimes(1);
      expect(flowerController.deleteFlowerById.mock.calls[0][0].params.id).toBe(flowerId);
    });

    test('should return 200 for successful deletion', async () => {
      const flowerId = new mongoose.Types.ObjectId().toString();
      flowerController.deleteFlowerById.mockImplementationOnce((req, res) => {
        res.status(200).json({ success: true, acknowledged: true, deletedCount: 1 });
      });

      const res = await request(app).delete(`/flowers/${flowerId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.acknowledged).toBe(true);
      expect(res.body.deletedCount).toBe(1);
    });
  });
});