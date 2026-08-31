import { Router } from "express";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

/** Protected read used by Feature 1 session tests. List CRUD is Feature 2. */
router.get("/", [authenticate], (_req, res) => {
  res.send([]);
});

export default router;
