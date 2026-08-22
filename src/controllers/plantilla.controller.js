import { obtenerListadoTemplates } from "../services/whatsapp.service.js";
import Plantilla from "../models/plantilla.model.js";

export const sincronizarPlantillas = async (req, res) => {
    try {
        const templates = await obtenerListadoTemplates();

        const operaciones = templates.map((item) =>
            Plantilla.findOneAndUpdate(
                { metaId: item.id },
                {
                    metaId: item.id,
                    name: item.name,
                    category: item.category,
                    language: item.language,
                    status: item.status,
                    components: item.components,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true },
            ),
        );

        const plantillas = await Promise.all(operaciones);

        res.status(200).json({ total: plantillas.length, plantillas });
    } catch (error) {
        res
            .status(error.response?.status || 500)
            .json(error.response?.data || { message: error.message });
    }
};

export const getPlantillas = async (req, res) => {
    try {
        const plantillas = await Plantilla.find();
        res.status(200).json(plantillas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
