// test/models/wishlist.model.test.js

const mongoose = require('mongoose');
const Wishlist = require('../../models/Wishlist'); // Adjust path as needed
const User = require('../../models/User');     // Required for referencing 'User'
const Flower = require('../../('../../models/Flower'); // Required for referencing 'Flower'
const Category = require('../models/Category'); // Required for Flower's category
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let mockUser1;
let mockUser2;
let mockCategory;
let mockFlower1;
let mockFlower2;

describe('Wishlist Model', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await Wishlist.deleteMany({});
    await User.deleteMany({});
    await Flower.deleteMany({});
    await Category.deleteMany({});

    // Create mock user, category, and flowers for referencing
    mockUser1 = await User.create({
      email: 'user1@example.com',
      displayName: 'User One',
    });
    mockUser2 = await User.create({
      email: 'user2@example.com',
      displayName: 'User Two',
    });
    mockCategory = await Category.create({ name: 'Roses' });
    mockFlower1 = await Flower.create({
      name: 'Red Rose',
      description: 'A vibrant red rose',
      price: 10.00,
      category: mockCategory._id,
      stock: 50,
    });
    mockFlower2 = await Flower.create({
      name: 'White Lily',
      description: 'Elegant white lily',
      price: 15.00,
      category: mockCategory._id,
      stock: 30,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // --- Test Case 1: Create a valid wishlist with no flowers ---
  test('should create and save a new wishlist successfully with no flowers', async () => {
    const wishlistData = {
      user: mockUser1._id,
    };
    const validWishlist = new Wishlist(wishlistData);
    const savedWishlist = await validWishlist.save();

    expect(savedWishlist._id).toBeDefined();
    expect(savedWishlist.user.toString()).toBe(mockUser1._id.toString());
    expect(savedWishlist.flowers).toEqual([]); // Should be an empty array
    expect(savedWishlist.createdAt).toBeInstanceOf(Date);
    expect(savedWishlist.updatedAt).toBeInstanceOf(Date);
    expect(savedWishlist.createdAt.getTime()).toBeCloseTo(Date.now(), -1000);
    expect(savedWishlist.updatedAt.getTime()).toBeCloseTo(Date.now(), -1000);
  });

  // --- Test Case 2: Create a valid wishlist with flowers ---
  test('should create and save a new wishlist successfully with flowers', async () => {
    const wishlistData = {
      user: mockUser1._id,
      flowers: [mockFlower1._id, mockFlower2._id],
    };
    const validWishlist = new Wishlist(wishlistData);
    const savedWishlist = await validWishlist.save();

    expect(savedWishlist._id).toBeDefined();
    expect(savedWishlist.user.toString()).toBe(mockUser1._id.toString());
    expect(savedWishlist.flowers.length).toBe(2);
    expect(savedWishlist.flowers[0].toString()).toBe(mockFlower1._id.toString());
    expect(savedWishlist.flowers[1].toString()).toBe(mockFlower2._id.toString());
  });

  // --- Test Case 3: Required 'user' field ---
  test('should fail to save if user is missing', async () => {
    const wishlistData = {
      flowers: [mockFlower1._id],
    };
    const wishlist = new Wishlist(wishlistData);
    let err;
    try {
      await wishlist.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.user).toBeDefined();
    expect(err.errors.user.message).toContain('Path `user` is required.');
  });

  // --- Test Case 4: Unique 'user' field ---
  test('should fail to save a second wishlist for the same user', async () => {
    const wishlistData1 = { user: mockUser1._id, flowers: [mockFlower1._id] };
    const wishlistData2 = { user: mockUser1._id, flowers: [mockFlower2._id] }; // Same user

    await new Wishlist(wishlistData1).save(); // Save the first wishlist

    const wishlist2 = new Wishlist(wishlistData2);
    let err;
    try {
      await wishlist2.save(); // Try saving the second wishlist for the same user
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.mongo.MongoError); // MongoError for unique constraint
    expect(err.code).toBe(11000); // Duplicate key error
    expect(err.message).toContain('duplicate key error');
  });

  test('should allow different users to have wishlists', async () => {
    const wishlistData1 = { user: mockUser1._id };
    const wishlistData2 = { user: mockUser2._id };

    await new Wishlist(wishlistData1).save();
    const savedWishlist2 = await new Wishlist(wishlistData2).save(); // This should succeed

    expect(savedWishlist2._id).toBeDefined();
    expect(savedWishlist2.user.toString()).toBe(mockUser2._id.toString());
  });

  // --- Test Case 5: 'updatedAt' pre-save hook ---
  test('should update updatedAt field on save', async () => {
    const wishlistData = {
      user: mockUser1._id,
    };
    const wishlist = new Wishlist(wishlistData);
    const initialSave = await wishlist.save();

    const initialUpdatedAt = initialSave.updatedAt;

    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate time passing

    // Add a flower to trigger an update
    initialSave.flowers.push(mockFlower1._id);
    const updatedWishlist = await initialSave.save();

    expect(updatedWishlist.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    expect(updatedWishlist.updatedAt.getTime()).toBeCloseTo(Date.now(), -1000);
  });

  // --- Test Case 6: Populating user and flowers ---
  test('should be able to populate user and flowers fields', async () => {
    const wishlistData = {
      user: mockUser1._id,
      flowers: [mockFlower1._id, mockFlower2._id],
    };
    const wishlist = new Wishlist(wishlistData);
    const savedWishlist = await wishlist.save();

    const populatedWishlist = await Wishlist.findById(savedWishlist._id)
      .populate('user', 'email displayName')
      .populate('flowers', 'name price'); // Populate specific fields of flowers

    expect(populatedWishlist.user).toBeDefined();
    expect(populatedWishlist.user.email).toBe(mockUser1.email);
    expect(populatedWishlist.user.displayName).toBe(mockUser1.displayName);

    expect(populatedWishlist.flowers.length).toBe(2);
    expect(populatedWishlist.flowers[0]).toBeDefined();
    expect(populatedWishlist.flowers[0].name).toBe(mockFlower1.name);
    expect(populatedWishlist.flowers[0].price).toBe(mockFlower1.price);

    expect(populatedWishlist.flowers[1]).toBeDefined();
    expect(populatedWishlist.flowers[1].name).toBe(mockFlower2.name);
    expect(populatedWishlist.flowers[1].price).toBe(mockFlower2.price);
  });
});