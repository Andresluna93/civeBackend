import express from "express";
import {
  createChat,
  getChats,
  updateStateChat,
  sweepAbandonedChats,
  sweepAbandonedChatsAgain,
  updateChatHistorial,
  updateChat,
  updateStatusChat,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/create", createChat);
router.get("/get", getChats);
router.put("/updateState/:wa_id", updateStateChat);
router.post("/sweep", sweepAbandonedChats);
router.post("/sweep-again", sweepAbandonedChatsAgain);
router.put("/updatehistorial", updateChatHistorial);
router.put("/updatechat", updateChat);
router.post("/updatestatus", updateStatusChat);
//router.get('/get/:wa_id', getChat);
//router.put("/update/:wa_id", updateChat);

export default router;
