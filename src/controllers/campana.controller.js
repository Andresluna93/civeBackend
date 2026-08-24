import { parse } from "csv-parse/sync";
import {
  enviarTemplateWhatsapp,
  obtenerListadoTemplates,
} from "../services/whatsapp.service.js";
import Campana from "../models/campana.model.js";
import ContactoCampana from "../models/contactoCampana.model.js";
import Plantilla from "../models/plantilla.model.js";
import EstadoMensaje from "../models/estadoMensaje.model.js";

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

export const sendTemplateArchivo = async (req, res) => {
  const { templateName } = req.body;
  console.log(`[sendTemplateArchivo] templateName='${templateName}' archivo='${req.file?.originalname}' size=${req.file?.size}`);

  if (!templateName) {
    return res.status(400).json({ message: "templateName es requerido" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Debe enviar un archivo CSV" });
  }

  try {
    const plantilla = await Plantilla.findOne({ name: templateName });
    console.log(`[sendTemplateArchivo] plantilla encontrada:`, plantilla ? { name: plantilla.name, language: plantilla.language, status: plantilla.status } : null);

    if (!plantilla) {
      return res.status(404).json({
        message: `No se encontró la plantilla '${templateName}'. Sincroniza las plantillas primero.`,
      });
    }

    if (plantilla.status !== "APPROVED") {
      return res.status(400).json({
        message: `La plantilla '${templateName}' no está aprobada (status: ${plantilla.status})`,
      });
    }

    let filas;
    try {
      const crudo = req.file.buffer.toString("utf8");
      console.log(`[sendTemplateArchivo] primeras líneas del archivo:\n${crudo.split(/\r?\n/).slice(0, 5).join("\n")}`);

      filas = parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: [",", ";"],
        relax_column_count: true,
      });
      console.log(`[sendTemplateArchivo] filas parseadas: ${filas.length}`);
    } catch (error) {
      console.error(`[sendTemplateArchivo] error parseando CSV:`, error.message);
      return res.status(400).json({ message: `Error al leer el archivo: ${error.message}` });
    }

    const resultado = { total: filas.length, exitosos: 0, fallidos: [] };

    for (const [index, fila] of filas.entries()) {
      const { telefono, ...variables } = fila;

      if (!telefono) {
        console.warn(`[sendTemplateArchivo] fila ${index + 1} sin telefono, se omite`, fila);
        resultado.fallidos.push({ error: "telefono es requerido", datos: fila });
        continue;
      }

      try {
        // igual que en sendManyTemplates: por ahora las variables van en el header, posicionales
        const headerParametros = Object.values(variables).map((valor) => ({
          type: "text",
          text: String(valor),
        }));

        console.log(`[sendTemplateArchivo] fila ${index + 1} -> enviando a ${telefono} con params=${JSON.stringify(variables)}`);

        const data = await enviarTemplateWhatsapp({
          to: telefono,
          templateName: plantilla.name,
          languageCode: plantilla.language,
          components: headerParametros.length
            ? [{ type: "header", parameters: headerParametros }]
            : [],
        });

        const mensajeId = data.messages?.[0]?.id;
        console.log(`[sendTemplateArchivo] fila ${index + 1} -> OK, mensajeId=${mensajeId}`);

        await EstadoMensaje.create({
          mensajeId,
          plantilla: plantilla._id,
          recipientId: telefono,
          status: "sent",
          timestampMeta: new Date(),
        });

        resultado.exitosos += 1;
      } catch (error) {
        console.error(`[sendTemplateArchivo] fila ${index + 1} -> FALLO ${telefono}:`, error.response?.data || error.message);
        resultado.fallidos.push({
          telefono,
          error: error.response?.data || error.message,
        });
      }
    }

    console.log(`[sendTemplateArchivo] resultado final: total=${resultado.total} exitosos=${resultado.exitosos} fallidos=${resultado.fallidos.length}`);

    res.status(207).json(resultado);
  } catch (error) {
    console.error(`[sendTemplateArchivo] error inesperado:`, error.message);
    res.status(500).json({ message: error.message });
  }
};
