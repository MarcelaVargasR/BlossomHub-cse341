// test/models/category.model.test.js

const mongoose = require('mongoose');
const Category = require('../../models/Category'); // Adjust path as needed
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

describe('Category Model', () => {
  beforeAll(async () => {
    // Start the in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Connect Mongoose to the in-memory database
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    // Clear the database after each test
    await Category.deleteMany({});
  });

  afterAll(async () => {
    // Disconnect Mongoose and stop the in-memory server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // --- Test Case 1: Create a valid category ---
  test('should create and save a new category successfully', async () => {
    const categoryData = {
      name: 'Electronics',
      description: 'Devices and gadgets',
    };
    const validCategory = new Category(categoryData);
    const savedCategory = await validCategory.save();

    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBe(categoryData.name);
    expect(savedCategory.description).toBe(categoryData.description);
    expect(savedCategory.createdAt).toBeInstanceOf(Date);
    expect(savedCategory.updatedAt).toBeInstanceOf(Date);
    expect(savedCategory.createdAt.getTime()).toBeCloseTo(Date.now(), -1000); // within a second
    expect(savedCategory.updatedAt.getTime()).toBeCloseTo(Date.now(), -1000); // within a second
  });

  // --- Test Case 2: Required 'name' field ---
  test('should fail to save if name is missing', async () => {
    const categoryData = {
      description: 'Category without a name',
    };
    const category = new Category(categoryData);
    let err;
    try {
      await category.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
    expect(err.errors.name.message).toContain('Category name is required.');
  });

  // --- Test Case 3: Unique 'name' field ---
  test('should fail to save if name is not unique', async () => {
    const categoryData1 = { name: 'Books', description: 'Reading material' };
    const categoryData2 = { name: 'Books', description: 'Another book category' };

    await new Category(categoryData1).save(); // Save the first category

    const category2 = new Category(categoryData2);
    let err;
    try {
      await category2.save(); // Try saving the second category with the same name
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.mongo.MongoError); // MongoError for unique constraint
    // Error code 11000 is for duplicate key error (unique constraint)
    expect(err.code).toBe(11000);
    expect(err.message).toContain('duplicate key error');
  });

  // --- Test Case 4: 'trim' property for name and description ---
  test('should trim whitespace from name and description', async () => {
    const categoryData = {
      name: '  Trimmed Name  ',
      description: '  Trimmed Description  ',
    };
    const category = new Category(categoryData);
    const savedCategory = await category.save();

    expect(savedCategory.name).toBe('Trimmed Name');
    expect(savedCategory.description).toBe('Trimmed Description');
  });

  // --- Test Case 5: 'updatedAt' pre-save hook ---
  test('should update updatedAt field on save', async () => {
    const categoryData = { name: 'Clothing' };
    const category = new Category(categoryData);
    const initialSave = await category.save();

    // Store initial updatedAt
    const initialUpdatedAt = initialSave.updatedAt;

    // Simulate some time passing (optional, but good for clarity)
    await new Promise(resolve => setTimeout(resolve, 50));

    // Update and save again
    initialSave.description = 'Apparel and accessories';
    const updatedCategory = await initialSave.save();

    // The updatedAt date should be later than the initial save's updatedAt
    expect(updatedCategory.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    // Also, it should be very close to the current time when it was updated
    expect(updatedCategory.updatedAt.getTime()).toBeCloseTo(Date.now(), -1000);
  });

  // --- Test Case 6: Default value for createdAt and updatedAt on creation ---
  test('should have default createdAt and updatedAt values on creation', async () => {
    const categoryData = { name: 'Automotive' };
    const category = new Category(categoryData);
    const savedCategory = await category.save();

    expect(savedCategory.createdAt).toBeDefined();
    expect(savedCategory.updatedAt).toBeDefined();
    // For a fresh save, createdAt and updatedAt should be very close
    expect(savedCategory.createdAt.getTime()).toBeCloseTo(savedCategory.updatedAt.getTime(), 10); // within 10ms
  });
});