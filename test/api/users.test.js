const request = require("supertest");
const app = require("../app"); // Adjust the path to your Express app

describe("GET /api/users", () => {
  it("should return all users (Admin only)", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer your_test_token`); // Include authentication if required

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
