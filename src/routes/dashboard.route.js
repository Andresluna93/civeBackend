import {
  getDurationChats,
  getStartedChats,
  getChatsByEstado,
  getSucursalChats
} from "../controllers/dashboard.controller.js";
import { Router } from "express";

const router = Router();

router.get("/duration-chats", getDurationChats);
router.get("/conversations", getStartedChats);
router.get("/chats-estado", getChatsByEstado);
router.get("/sucursal", getSucursalChats);

export default router;
