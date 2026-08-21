import { parse } from "csv-parse/sync";
import Contacto from "../models/contactos.model.js";
import ContactoCampana from "../models/contactoCampana.model.js";

const normalizarFila = (fila) => {
  const { nombres, apellidos, telefono, identificador, variables, ...resto } =
    fila;
  return {
    nombres: nombres?.toString().trim(),
    apellidos: apellidos?.toString().trim(),
    telefono: telefono?.toString().trim(),
    identificador: identificador || null,
    // en CSV las columnas extra (fuera de nombres/apellidos/telefono/identificador) son las variables del template
    variables: variables && typeof variables === "object" ? variables : resto,
  };
};

export const getContactos = async (req, res) => {
  try {
    const contactos = await Contacto.find();
    res.status(200).json(contactos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createContacto = async (req, res) => {
  const { nombres, apellidos, telefono, identificador } = req.body;
  try {
    const newContacto = new Contacto({
      nombres,
      apellidos,
      telefono,
      identificador,
    });
    const contactoSaved = await newContacto.save();
    res.status(201).json(contactoSaved);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "El teléfono ya está registrado" });
    }
    res.status(400).json({ message: error.message });
  }
};

export const importContactosCampana = async (req, res) => {
  const { campana } = req.body;

  if (!campana) {
    return res
      .status(400)
      .json({ message: "El id de la campaña es requerido" });
  }

  let filas;
  try {
    if (req.file) {
      filas = parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } else if (Array.isArray(req.body.contactos)) {
      filas = req.body.contactos;
    } else {
      return res.status(400).json({
        message:
          "Debe enviar un archivo CSV (campo 'file') o un array 'contactos' en el body",
      });
    }
  } catch (error) {
    return res
      .status(400)
      .json({ message: `Error al leer el archivo: ${error.message}` });
  }

  const resultado = { total: filas.length, exitosos: 0, fallidos: [] };

  for (const [index, fila] of filas.entries()) {
    try {
      const { nombres, apellidos, telefono, identificador, variables } =
        normalizarFila(fila);

      if (!nombres || !apellidos || !telefono) {
        throw new Error("nombres, apellidos y telefono son requeridos");
      }

      const contacto = await Contacto.findOneAndUpdate(
        { telefono },
        { nombres, apellidos, telefono, identificador },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      await ContactoCampana.findOneAndUpdate(
        { contacto: contacto._id, campana },
        { contacto: contacto._id, campana, variables },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      resultado.exitosos += 1;
    } catch (error) {
      resultado.fallidos.push({
        fila: index + 1,
        error: error.message,
        datos: fila,
      });
    }
  }

  res.status(207).json(resultado);
};
