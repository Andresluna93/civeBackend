import express from "express";

import { getUser, registerUser } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/findUser", getUser);
router.post("/registerParticipant", registerUser)

export default router;
