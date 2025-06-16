
// test/api/categories.test.js

// IMPORTANT: Mock environment variables for Passport GitHub Strategy
// This ensures that app.js can load without issues during testing,
// as the actual values are not needed for these API endpoint tests.
process.env.GITHUB_CLIENT_ID = 'mock_client_id';
process.env.CLIENT_SECRET = 'mock_client_secret';
process.env.CALLBACK_URL = 'http://localhost:3000/auth/github/callback';
// Also mock NODE_ENV to prevent the server from starting in app.js
// if that logic is present (as discussed in previous `app.js` examples)
process.env.NODE_ENV = 'test';


const request = require('supertest');
const { app } = require('../../app'); // Correctly destructure 'app' from app.js
const Category = require('../../models/Category'); // Adjust path if your model is elsewhere

// Crucial: Mock the Mongoose Category model to prevent actual database interactions.
// This ensures your tests are fast, isolated, and deterministic.
jest.mock('../../models/Category');

// You might also need to mock other modules that app.js directly requires
// if they cause side effects or require specific setup during testing.
// For example, if connectDB() tries to connect to a real DB immediately:
// jest.mock('../../utils/db', () => ({
//   __esModule: true, // Use this for ES Modules mocks
//   default: jest.fn(() => console.log('Mocking connectDB - no real DB connection')),
// }));


describe('Categories API', () => {
  // beforeEach runs before each individual test ('test' or 'it' block)
  beforeEach(() => {
    // Clear all mock implementations and call counts before each test.
    // This ensures that mocks from previous tests don't interfere with the current one.
    jest.clearAllMocks();
  });

  // --- GET All Categories ---
  test('GET /api/categories should return all categories', async () => {
    // Define mock data that your Category.find() method should return
    const mockCategories = [
      { _id: 'cat1', name: 'Roses', description: 'Various types of roses' },
      { _id: 'cat2', name: 'Lilies', description: 'Elegant lily flowers' },
    ];

    // Configure the mock implementation for Category.find()
    // It will return a Promise that resolves with our mock data
    Category.find.mockResolvedValue(mockCategories);

    // Make an HTTP GET request to your API using Supertest
    const response = await request(app).get('/api/categories');

    // Assertions: Check the response status, headers, and body
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual(mockCategories);

    // Verify that the mocked Category.find() method was called exactly once
    expect(Category.find).toHaveBeenCalledTimes(1);
  });

  test('GET /api/categories should return an empty array if no categories exist', async () => {
    Category.find.mockResolvedValue([]); // Simulate no categories in the DB

    const response = await request(app).get('/api/categories');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
    expect(Category.find).toHaveBeenCalledTimes(1);
  });

  test('GET /api/categories should handle errors gracefully', async () => {
    const errorMessage = 'Database error during find operation';
    Category.find.mockRejectedValue(new Error(errorMessage)); // Simulate a DB error

    const response = await request(app).get('/api/categories');

    // Assuming your error handling middleware sends a 500 status for server errors
    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty('message'); // Or a specific error structure
    // You might assert on the message if your error handler sends it back
    // expect(response.body.message).toContain(errorMessage);
    expect(Category.find).toHaveBeenCalledTimes(1);
  });


  // --- GET Single Category by ID ---
  test('GET /api/categories/:id should return a single category by ID', async () => {
    const mockCategory = { _id: 'cat1', name: 'Roses', description: 'Various types of roses' };

    Category.findById.mockResolvedValue(mockCategory);

    const response = await request(app).get('/api/categories/cat1');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual(mockCategory);
    expect(Category.findById).toHaveBeenCalledWith('cat1');
  });

  test('GET /api/categories/:id should return 404 if category not found', async () => {
    Category.findById.mockResolvedValue(null); // Simulate no category found for the ID

    const response = await request(app).get('/api/categories/nonexistentid');

    expect(response.statusCode).toBe(404);
    // Adjust this assertion based on what your API returns for a 404 not found
    expect(response.body).toHaveProperty('message');
  });

  test('GET /api/categories/:id should return 400 for invalid ID format', async () => {
    // Assuming Mongoose's findById would throw a CastError for invalid ID
    // or your controller validates input format before calling findById
    const invalidIdError = new Error('Cast to ObjectId failed for value "invalid"');
    invalidIdError.name = 'CastError'; // Mongoose typically sets error.name

    Category.findById.mockRejectedValue(invalidIdError); // Simulate Mongoose error for bad ID

    const response = await request(app).get('/api/categories/invalididformat');

    expect(response.statusCode).toBe(400); // Bad Request for invalid format
    expect(response.body).toHaveProperty('message');
  });


  // --- POST Create New Category ---
  test('POST /api/categories should create a new category', async () => {
    const newCategoryData = { name: 'New Category', description: 'Description for new category' };
    const savedCategory = { _id: 'newCatId123', ...newCategoryData };

    // When `new Category(data)` is called in your controller, it will return a mock object.
    // We then mock the `save()` method on that mock object.
    Category.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(savedCategory),
    }));

    const response = await request(app)
      .post('/api/categories')
      .send(newCategoryData); // Send the data for the new category

    expect(response.statusCode).toBe(201); // 201 Created for successful resource creation
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual(savedCategory);

    // Verify that the Category constructor was called with the correct data
    expect(Category).toHaveBeenCalledWith(newCategoryData);
    // Verify that the save method on the new instance was called once
    expect(Category().save).toHaveBeenCalledTimes(1);
  });

  test('POST /api/categories should return 400 for invalid/missing data', async () => {
    const invalidCategoryData = { description: 'Missing name, likely a required field' };

    const response = await request(app)
      .post('/api/categories')
      .send(invalidCategoryData);

    expect(response.statusCode).toBe(400); // Bad Request
    expect(response.body).toHaveProperty('message'); // Ensure an error message is returned
  });


  // --- PUT Update Category ---
  test('PUT /api/categories/:id should update an existing category', async () => {
    const categoryId = 'cat1';
    const updatedData = { name: 'Updated Roses', description: 'New description for roses' };
    const mockUpdatedCategory = { _id: categoryId, ...updatedData };

    // Mock findByIdAndUpdate to return the updated document
    Category.findByIdAndUpdate.mockResolvedValue(mockUpdatedCategory);

    const response = await request(app)
      .put(`/api/categories/${categoryId}`)
      .send(updatedData);

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual(mockUpdatedCategory);
    // Verify that findByIdAndUpdate was called with the correct arguments
    expect(Category.findByIdAndUpdate).toHaveBeenCalledWith(
      categoryId,
      updatedData,
      // Assuming your update method uses { new: true, runValidators: true } for Mongoose
      expect.objectContaining({ new: true, runValidators: true })
    );
  });

  test('PUT /api/categories/:id should return 404 if category to update not found', async () => {
    Category.findByIdAndUpdate.mockResolvedValue(null); // Simulate category not found

    const response = await request(app)
      .put('/api/categories/nonexistentid')
      .send({ name: 'Attempt to Update' });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  test('PUT /api/categories/:id should return 400 for invalid update data', async () => {
    const categoryId = 'cat1';
    const invalidUpdateData = { name: '' }; // Assuming name cannot be empty

    // You might mock a validation error from Mongoose here
    const validationError = new Error('Validation failed: name: Path `name` is required.');
    validationError.name = 'ValidationError';
    Category.findByIdAndUpdate.mockRejectedValue(validationError);

    const response = await request(app)
      .put(`/api/categories/${categoryId}`)
      .send(invalidUpdateData);

    expect(response.statusCode).toBe(400); // Bad Request due to validation error
    expect(response.body).toHaveProperty('message');
  });


  // --- DELETE Category ---
  test('DELETE /api/categories/:id should delete a category', async () => {
    const categoryId = 'cat1';
    const mockDeletedCategory = { _id: categoryId, name: 'Deleted Item' };

    // Mock findByIdAndDelete to return the deleted document
    Category.findByIdAndDelete.mockResolvedValue(mockDeletedCategory);

    const response = await request(app).delete(`/api/categories/${categoryId}`);

    expect(response.statusCode).toBe(200);
    // Adjust this assertion based on your API's success message for deletion
    expect(response.body).toEqual({ message: 'Category deleted successfully' });
    expect(Category.findByIdAndDelete).toHaveBeenCalledWith(categoryId);
  });

  test('DELETE /api/categories/:id should return 404 if category to delete not found', async () => {
    Category.findByIdAndDelete.mockResolvedValue(null); // Simulate category not found

    const response = await request(app).delete('/api/categories/nonexistentid');

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

});