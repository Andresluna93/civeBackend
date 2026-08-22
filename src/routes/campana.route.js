import express from "express";
import {
  sendTemplate,
  sendManyTemplates,
  getAllTemplates,
} from "../controllers/campana.controller.js";

const router = express.Router();

router.get("/getTemplates", getAllTemplates);
router.post("/sendTemplate", sendTemplate);
router.post("/sendManyTemplates", sendManyTemplates);

export default router;
