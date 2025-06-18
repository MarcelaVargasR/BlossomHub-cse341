const request = require("supertest");
const app = require("../app"); // Adjust to your Express app

describe("GET /flowers", () => {
  it("should return all flowers", async () => {
    const response = await request(app).get("/flowers");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
