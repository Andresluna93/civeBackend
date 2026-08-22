import express from "express";
import { sincronizarPlantillas, getPlantillas } from "../controllers/plantilla.controller.js";

const router = express.Router();

router.post("/sincronizar", sincronizarPlantillas);
router.get("/", getPlantillas);

export default router;
