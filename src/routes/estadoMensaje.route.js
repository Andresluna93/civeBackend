import express from "express";
import { getEstadosMensajes, getEstadosMensajesEspecificos } from "../controllers/estadoMensaje.controller.js";

const router = express.Router();

router.get("/", getEstadosMensajes);
router.get("/especificos", getEstadosMensajesEspecificos);

export default router;
