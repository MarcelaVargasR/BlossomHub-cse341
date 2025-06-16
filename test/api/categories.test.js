
// test/api/categories.test.js
const request = require('supertest');
const { app } = require('../../app'); // *** IMPORTANT: Destructure 'app' here! ***
const Category = require('../../models/Category'); // Adjust path to your Category model if needed

// Mock the Category model to prevent actual database interactions during tests
jest.mock('../../models/Category');

describe('Categories API', () => {
  // Clear all mock implementations before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test for GET all categories
  test('GET /api/categories should return all categories', async () => {
    const mockCategories = [
      { _id: 'cat1', name: 'Roses', description: 'Various types of roses' },
      { _id: 'cat2', name: 'Lilies', description: 'Elegant lily flowers' },
    ];

    Category.find.mockResolvedValue(mockCategories); // Mock the database call

    const response = await request(app).get('/api/categories');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual(mockCategories);
    expect(Category.find).toHaveBeenCalledTimes(1);
  });

  // Test for GET a single category by ID
  test('GET /api/categories/:id should return a single category', async () => {
    const mockCategory = { _id: 'cat1', name: 'Roses', description: 'Various types of roses' };

    Category.findById.mockResolvedValue(mockCategory);

    const response = await request(app).get('/api/categories/cat1');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual(mockCategory);
    expect(Category.findById).toHaveBeenCalledWith('cat1');
  });

  test('GET /api/categories/:id should return 404 if category not found', async () => {
    Category.findById.mockResolvedValue(null);

    const response = await request(app).get('/api/categories/nonexistentid');

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message'); // Check for an error message from your API
  });

  // Test for POST creating a new category
  test('POST /api/categories should create a new category', async () => {
    const newCategoryData = { name: 'New Category', description: 'Description for new category' };
    const savedCategory = { _id: 'newCatId123', ...newCategoryData };

    Category.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(savedCategory),
    }));

    const response = await request(app)
      .post('/api/categories')
      .send(newCategoryData);

    expect(response.statusCode).toBe(201); // 201 Created
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual(savedCategory);

    expect(Category).toHaveBeenCalledWith(newCategoryData);
    expect(Category().save).toHaveBeenCalledTimes(1);
  });

  test('POST /api/categories should return 400 for invalid data', async () => {
    const invalidCategoryData = { description: 'Missing name, which is likely required' };

    const response = await request(app)
      .post('/api/categories')
      .send(invalidCategoryData);

    expect(response.statusCode).toBe(400); // Bad Request
    expect(response.body).toHaveProperty('message');
  });

  // Test for PUT updating a category
  test('PUT /api/categories/:id should update an existing category', async () => {
    const categoryId = 'cat1';
    const updatedData = { name: 'Updated Roses', description: 'New description for roses' };
    const mockUpdatedCategory = { _id: categoryId, ...updatedData };

    Category.findByIdAndUpdate.mockResolvedValue(mockUpdatedCategory);

    const response = await request(app)
      .put(`/api/categories/${categoryId}`)
      .send(updatedData);

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual(mockUpdatedCategory);
    expect(Category.findByIdAndUpdate).toHaveBeenCalledWith(
      categoryId,
      updatedData,
      { new: true, runValidators: true }
    );
  });

  test('PUT /api/categories/:id should return 404 if category to update not found', async () => {
    Category.findByIdAndUpdate.mockResolvedValue(null);

    const response = await request(app)
      .put('/api/categories/nonexistentid')
      .send({ name: 'Attempt Update' });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  // Test for DELETE a category
  test('DELETE /api/categories/:id should delete a category', async () => {
    const categoryId = 'cat1';
    const mockDeletedCategory = { _id: categoryId, name: 'Deleted Item' };

    Category.findByIdAndDelete.mockResolvedValue(mockDeletedCategory);

    const response = await request(app).delete(`/api/categories/${categoryId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: 'Category deleted successfully' }); // Adjust message as per your API
    expect(Category.findByIdAndDelete).toHaveBeenCalledWith(categoryId);
  });

  test('DELETE /api/categories/:id should return 404 if category to delete not found', async () => {
    Category.findByIdAndDelete.mockResolvedValue(null);

    const response = await request(app).delete('/api/categories/nonexistentid');

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});