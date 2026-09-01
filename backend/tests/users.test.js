/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

const profileBody = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
  ...overrides,
});

describe("Feature 4 — User profile API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  describe("US-4.2 — Edit profile", () => {
    it("User saves profile changes", async () => {
      const user = await registerUser();

      const response = await request(app)
        .put(`/todo/users/${user.user.userId}`)
        .set(user.authHeader)
        .send(
          profileBody({
            fName: "Janet",
            lName: "Doer",
            email: "janet@example.com",
            username: "janetd",
          })
        );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: user.user.userId,
        fName: "Janet",
        lName: "Doer",
        email: "janet@example.com",
        username: "janetd",
        role: "worker",
      });
      expect(response.body.password).toBeUndefined();
    });

    it("User fetches their own profile", async () => {
      const user = await registerUser();

      const response = await request(app)
        .get(`/todo/users/${user.user.userId}`)
        .set(user.authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: user.user.userId,
        fName: "Test",
        lName: "User",
        email: "test@example.com",
        username: "testuser",
        role: "worker",
      });
      expect(response.body.password).toBeUndefined();
    });

    it("User attempts to fetch another user's profile", async () => {
      const userA = await registerUser();
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await request(app)
        .get(`/todo/users/${userB.user.userId}`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `User with id=${userB.user.userId} not found.`,
      });
    });

    it("User attempts to update another user's profile", async () => {
      const userA = await registerUser();
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
        fName: "Bee",
        lName: "User",
      });

      const response = await request(app)
        .put(`/todo/users/${userB.user.userId}`)
        .set(userA.authHeader)
        .send(
          profileBody({
            fName: "Hacked",
            lName: "Name",
            email: "hacked@example.com",
            username: "hacked",
          })
        );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `User with id=${userB.user.userId} not found.`,
      });

      const storedB = await db.user.findByPk(userB.user.userId);
      expect(storedB.fName).toBe("Bee");
      expect(storedB.username).toBe("userb");
      expect(storedB.email).toBe("b@example.com");
    });

    it("Unauthenticated profile API request", async () => {
      const response = await request(app).get("/todo/users/1");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("Profile update rejects a password that is too short", async () => {
      const user = await registerUser();

      const response = await request(app)
        .put(`/todo/users/${user.user.userId}`)
        .set(user.authHeader)
        .send({ password: "short" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Password must be at least 8 characters.",
      });
    });

    it("Profile update rejects missing required fields", async () => {
      const user = await registerUser();

      const response = await request(app)
        .put(`/todo/users/${user.user.userId}`)
        .set(user.authHeader)
        .send({
          lName: "User",
          email: "test@example.com",
          username: "testuser",
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "First name is required." });

      const stored = await db.user.findByPk(user.user.userId);
      expect(stored.fName).toBe("Test");
    });

    it("Profile update rejects a duplicate username", async () => {
      const userA = await registerUser();
      await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await request(app)
        .put(`/todo/users/${userA.user.userId}`)
        .set(userA.authHeader)
        .send(profileBody({ username: "userb" }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Username is already taken." });

      const storedB = await db.user.findOne({ where: { username: "userb" } });
      expect(storedB).not.toBeNull();
      expect(storedB.email).toBe("b@example.com");
    });

    it("Profile update rejects a duplicate email", async () => {
      const userA = await registerUser();
      await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await request(app)
        .put(`/todo/users/${userA.user.userId}`)
        .set(userA.authHeader)
        .send(profileBody({ email: "b@example.com" }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Email is already registered." });

      const storedB = await db.user.findOne({ where: { email: "b@example.com" } });
      expect(storedB).not.toBeNull();
      expect(storedB.username).toBe("userb");
    });

    it("Unauthenticated profile update API request", async () => {
      const response = await request(app).put("/todo/users/1").send(profileBody());

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/);
    });
  });
});
