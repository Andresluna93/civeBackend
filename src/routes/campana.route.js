import express from "express";
import { uploadCsv } from "../middlewares/upload.middleware.js";
import {
  sendTemplate,
  sendManyTemplates,
  sendTemplateArchivo,
  getAllTemplates,
} from "../controllers/campana.controller.js";

const router = express.Router();

router.get("/getTemplates", getAllTemplates);
router.post("/sendTemplate", sendTemplate);
router.post("/sendManyTemplates", sendManyTemplates);
router.post("/sendTemplateArchivo", uploadCsv.single("file"), sendTemplateArchivo);

export default router;
