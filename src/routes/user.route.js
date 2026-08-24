import express from "express";

import {
  loginUser,
  logoutUser,
  registerUser,
  dashboard,
  getAllUsers,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.Middleware.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, dashboard);
router.get("/getUsers", authMiddleware, getAllUsers);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/registerParticipant", authMiddleware, registerUser);

export default router;
