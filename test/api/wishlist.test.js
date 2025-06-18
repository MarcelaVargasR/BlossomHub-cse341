const request = require("supertest");
const app = require("../app"); // Adjust based on your project setup
const mongoose = require("mongoose");
const Wishlist = require("../models/Wishlist");
const Flower = require("../models/Flower");
const User = require("../models/User");

describe("Wishlist API", () => {
  let testUser, testFlower;

  beforeAll(async () => {
    // Create