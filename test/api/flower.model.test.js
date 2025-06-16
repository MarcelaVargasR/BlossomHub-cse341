// test/models/flower.model.test.js

const mongoose = require('mongoose');
const Flower = require('../../models/Flower'); // Adjust path as needed
const Category = require('../../models/Category'); // Also need Category for referencing
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let mockCategory; // To hold a category ID for testing

describe('Flower Model', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    // Clear the database before each test
    await Flower.deleteMany({});
    await Category.deleteMany({});

    // Create a mock category to use for flower tests
    mockCategory = await Category.create({ name: 'Roses', description: 'Various types of roses' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // --- Test Case 1: Create a valid flower ---
  test('should create and save a new flower successfully', async () => {
    const flowerData = {
      name: 'Red Rose',
      description: 'A beautiful red rose',
      price: 10.99,
      category: mockCategory._id,
      imageUrl: 'http://example.com/red_rose.jpg',
      stock: 100,
      isFeatured: true,
    };
    const validFlower = new Flower(flowerData);
    const savedFlower = await validFlower.save();

    expect(savedFlower._id).toBeDefined();
    expect(savedFlower.name).toBe(flowerData.name);
    expect(savedFlower.description).toBe(flowerData.description);
    expect(savedFlower.price).toBe(flowerData.price);
    expect(savedFlower.category.toString()).toBe(flowerData.category.toString()); // Compare ObjectId as string
    expect(savedFlower.imageUrl).toBe(flowerData.imageUrl);
    expect(savedFlower.stock).toBe(flowerData.stock);
    expect(savedFlower.isFeatured).toBe(flowerData.isFeatured);
    expect(savedFlower.createdAt).toBeInstanceOf(Date);
    expect(savedFlower.updatedAt).toBeInstanceOf(Date);
    expect(savedFlower.createdAt.getTime()).toBeCloseTo(Date.now(), -1000);
    expect(savedFlower.updatedAt.getTime()).toBeCloseTo(Date.now(), -1000);
  });

  // --- Test Case 2: Required 'name' field ---
  test('should fail to save if name is missing', async () => {
    const flowerData = {
      description: 'Flower without a name',
      price: 5.00,
      category: mockCategory._id,
      stock: 50,
    };
    const flower = new Flower(flowerData);
    let err;
    try {
      await flower.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
    expect(err.errors.name.message).toContain('Flower name is required.');
  });

  // --- Test Case 3: Required 'price' field ---
  test('should fail to save if price is missing', async () => {
    const flowerData = {
      name: 'Missing Price Flower',
      description: 'Flower without a price',
      category: mockCategory._id,
      stock: 50,
    };
    const flower = new Flower(flowerData);
    let err;
    try {
      await flower.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.price).toBeDefined();
    expect(err.errors.price.message).toContain('Price is required.');
  });

  // --- Test Case 4: 'price' cannot be negative ---
  test('should fail to save if price is negative', async () => {
    const flowerData = {
      name: 'Negative Price Flower',
      price: -10.00,
      category: mockCategory._id,
      stock: 50,
    };
    const flower = new Flower(flowerData);
    let err;
    try {
      await flower.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.price).toBeDefined();
    expect(err.errors.price.message).toContain('Price cannot be negative.');
  });

  // --- Test Case 5: Required 'category' field ---
  test('should fail to save if category is missing', async () => {
    const flowerData = {
      name: 'No Category Flower',
      price: 10.00,
      stock: 50,
    };
    const flower = new Flower(flowerData);
    let err;
    try {
      await flower.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.category).toBeDefined();
    expect(err.errors.category.message).toContain('Category is required.');
  });

  // --- Test Case 6: Required 'stock' field ---
  test('should fail to save if stock is missing', async () => {
    const flowerData = {
      name: 'Missing Stock Flower',
      price: 10.00,
      category: mockCategory._id,
    };
    const flower = new Flower(flowerData);
    let err;
    try {
      await flower.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.stock).toBeDefined();
    expect(err.errors.stock.message).toContain('Stock quantity is required.');
  });

  // --- Test Case 7: 'stock' cannot be negative ---
  test('should fail to save if stock is negative', async () => {
    const flowerData = {
      name: 'Negative Stock Flower',
      price: 10.00,
      category: mockCategory._id,
      stock: -5,
    };
    const flower = new Flower(flowerData);
    let err;
    try {
      await flower.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.stock).toBeDefined();
    expect(err.errors.stock.message).toContain('Stock cannot be negative.');
  });


  // --- Test Case 8: 'trim' property for name, description, imageUrl ---
  test('should trim whitespace from name, description, and imageUrl', async () => {
    const flowerData = {
      name: '  Trimmed Flower  ',
      description: '  Trimmed Description  ',
      price: 12.34,
      category: mockCategory._id,
      imageUrl: '  http://example.com/image.png  ',
      stock: 50,
    };
    const flower = new Flower(flowerData);
    const savedFlower = await flower.save();

    expect(savedFlower.name).toBe('Trimmed Flower');
    expect(savedFlower.description).toBe('Trimmed Description');
    expect(savedFlower.imageUrl).toBe('http://example.com/image.png');
  });

  // --- Test Case 9: 'updatedAt' pre-save hook ---
  test('should update updatedAt field on save', async () => {
    const flowerData = {
      name: 'Updating Flower',
      price: 20.00,
      category: mockCategory._id,
      stock: 10,
    };
    const flower = new Flower(flowerData);
    const initialSave = await flower.save();

    const initialUpdatedAt = initialSave.updatedAt;

    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate time passing

    initialSave.description = 'Updated description';
    const updatedFlower = await initialSave.save();

    expect(updatedFlower.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    expect(updatedFlower.updatedAt.getTime()).toBeCloseTo(Date.now(), -1000);
  });

  // --- Test Case 10: Default 'isFeatured' to false ---
  test('should set isFeatured to false by default', async () => {
    const flowerData = {
      name: 'Default Featured Flower',
      price: 5.00,
      category: mockCategory._id,
      stock: 20,
    };
    const flower = new Flower(flowerData);
    const savedFlower = await flower.save();

    expect(savedFlower.isFeatured).toBe(false);
  });

  // --- Test Case 11: Populating category ---
  test('should be able to populate the category field', async () => {
    const flowerData = {
      name: 'Populate Test',
      price: 20.00,
      category: mockCategory._id,
      stock: 10,
    };
    const flower = new Flower(flowerData);
    const savedFlower = await flower.save();

    const populatedFlower = await Flower.findById(savedFlower._id).populate('category');

    expect(populatedFlower.category).toBeDefined();
    expect(populatedFlower.category.name).toBe(mockCategory.name);
    expect(populatedFlower.category._id.toString()).toBe(mockCategory._id.toString());
  });
});