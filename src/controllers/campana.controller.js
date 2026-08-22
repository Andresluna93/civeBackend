import {
  enviarTemplateWhatsapp,
  obtenerListadoTemplates,
} from "../services/whatsapp.service.js";
import Campana from "../models/campana.model.js";
import ContactoCampana from "../models/contactoCampana.model.js";

export const getAllTemplates = async (req, res) => {
  try {
    const response = await obtenerListadoTemplates();
    console.log(response);
    res.status(200).json(response);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { message: error.message });
  }
};

export const sendTemplate = async (req, res) => {
  try {
    /*const parametros = Object.entries(contactoCampana.variables).map(([key, value]) => ({
        type: "text",
        parameter_name: key,   // debe coincidir con el nombre de variable definido en el template
        text: String(value),
       }));*/
    const { telefono, nombres } = req.body;
    //const { telefono } = req.body;
    if (!nombres || !telefono) {
      return res
        .status(403)
        .json({ error: "El cliente no ha dado consentimiento (opt-in)" });
    }

    const data = await enviarTemplateWhatsapp({
      to: telefono,
      templateName: "no_tienen_diagnostico",
      languageCode: "es_EC",
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "text",
              text: nombres,
            },
          ],
        },
      ],
      /*/headerParametros: [
        {
          type: "text",
          parameter_name: "name",
          text: "Ramiro",
        },
      ],*/
      /*bodyParametros: [
        {
          type: "text",
          parameter_name: "name",
          text: nombres,
        },
      ],*/ // ["Juan", "150"] -> {{1}}, {{2}}...
    });
    res.status(200).json(data);
  } catch (error) {
    // Graph API devuelve el detalle del error en error.response.data
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { message: error.message });
  }
};

export const sendManyTemplates = async (req, res) => {
  const { campanaId } = req.body;

  try {
    const campana = await Campana.findById(campanaId).populate("template");
    if (!campana) {
      return res.status(404).json({ message: "Campaña no encontrada" });
    }

    const registros = await ContactoCampana.find({
      campana: campana._id,
      estadoEnvio: "pendiente",
    }).populate("contacto");

    const resultado = { total: registros.length, exitosos: 0, fallidos: [] };

    for (const registro of registros) {
      try {
        // por ahora las variables del template van en el header, como parámetros posicionales
        const headerParametros = Object.values(registro.variables || {}).map(
          (valor) => ({
            type: "text",
            text: String(valor),
          }),
        );

        const data = await enviarTemplateWhatsapp({
          to: registro.contacto.telefono,
          templateName: campana.template.name,
          languageCode: campana.template.language,
          components: headerParametros.length
            ? [{ type: "header", parameters: headerParametros }]
            : [],
        });

        registro.estadoEnvio = "enviado";
        registro.mensajeId = data.messages[0].id;
        resultado.exitosos += 1;
      } catch (error) {
        registro.estadoEnvio = "fallido";
        resultado.fallidos.push({
          contacto: registro.contacto?.telefono,
          error: error.response?.data || error.message,
        });
      }
      await registro.save();
    }

    campana.estado = "completada";
    campana.fechaEnvio = new Date();
    await campana.save();

    res.status(200).json(resultado);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
