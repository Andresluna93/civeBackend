import express from "express";
import { uploadCsv } from "../middlewares/upload.middleware.js";
import {
  importContactosCampana,
  createContacto,
  getContactos,
} from "../controllers/contactos.controller.js";

const router = express.Router();

router.get("/", getContactos);
router.post("/register", createContacto);
router.post("/importar", uploadCsv.single("file"), importContactosCampana);

export default router;
