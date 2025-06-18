const request = require("supertest");
const app = require("../app"); // Adjust the path to your Express app

describe("GET /categories", () => {
  it("should return all categories", async () => {
    const response = await request(app).get("/categories");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
