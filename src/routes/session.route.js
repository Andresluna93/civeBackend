import express from "express";
import {
  createSession,
  updateSession,
  getSession,
} from "../controllers/session.controller.js";

const router = express.Router();

router.post("/register", createSession);
router.get("/oneregister", getSession);
router.put("/update/:wa_id", updateSession);

export default router;
