import mongoose from "mongoose";
import EstadoMensaje from "../models/estadoMensaje.model.js";
import Plantilla from "../models/plantilla.model.js";

const resolverPlantillaId = async (valor) => {
    if (mongoose.Types.ObjectId.isValid(valor)) {
        return new mongoose.Types.ObjectId(valor);
    }

    const plantilla = await Plantilla.findOne({ metaId: valor });
    return plantilla?._id || null;
};

const contarPorStatus = async (filtro) => {
    const agregacion = await EstadoMensaje.aggregate([
        { $match: filtro },
        { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const conteo = { sent: 0, delivered: 0, read: 0, failed: 0 };
    agregacion.forEach(({ _id, count }) => {
        conteo[_id] = count;
    });

    return conteo;
};

export const getEstadosMensajes = async (req, res) => {
    try {
        const { status, plantilla } = req.query;
        const filtro = {};
        if (status) filtro.status = status;
        if (plantilla) {
            const plantillaId = await resolverPlantillaId(plantilla);
            if (!plantillaId) {
                return res.status(404).json({ message: `No se encontró la plantilla '${plantilla}'` });
            }
            filtro.plantilla = plantillaId;
        }

        const [registros, conteo] = await Promise.all([
            EstadoMensaje.find(filtro).populate("plantilla").sort({ createdAt: -1 }),
            contarPorStatus(filtro),
        ]);

        res.status(200).json({ conteo, registros });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getEstadosMensajesEspecificos = async (req, res) => {
    try {
        const { mensajeId } = req.query;

        if (!mensajeId) {
            return res.status(400).json({ message: "mensajeId es requerido" });
        }

        const mensajeIds = mensajeId.split(",").map((id) => id.trim());
        const filtro = { mensajeId: { $in: mensajeIds } };

        const [registros, conteo] = await Promise.all([
            EstadoMensaje.find(filtro).populate("plantilla"),
            contarPorStatus(filtro),
        ]);

        res.status(200).json({ conteo, registros });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
