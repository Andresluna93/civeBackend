import express from "express";
import {
  createChat,
  getChats,
  getChatByWaId,
  getMessages,
  updateStateChat,
  sweepAbandonedChats,
  sweepAbandonedChatsAgain,
  updateChatHistorial,
  updateChat,
  updateStatusChat,
  obtenerChats
} from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/create", createChat);
router.get("/get", getChats);
router.get("/get/:wa_id", getChatByWaId);
router.put("/updateState/:wa_id", updateStateChat);
router.post("/sweep", sweepAbandonedChats);
router.post("/sweep-again", sweepAbandonedChatsAgain);
router.put("/updatehistorial", updateChatHistorial);
router.put("/updatechat", updateChat);
router.post("/updatestatus", updateStatusChat);
router.get("/:wa_id/messages", getMessages);
router.get("/listarmensajes", obtenerChats)

export default router;
