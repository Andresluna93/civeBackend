import session from "../models/session.model.js";

export const createSession = async (req, res) => {
  try {
    const { wa_id, name, estado } = req.body;
    const newSession = new session({
      wa_id,
      name,
      estado,
    });
    await newSession.save();
    res.status(201).json({
      success: true,
      message: "Sesión creada exitosamente",
      data: newSession,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error al crear la sesión",
    });
  }
};

export const getSession = async (req, res) => {
  try {
    const { wa_id, estado } = req.body;
    const sessionData = await session.findOne({ wa_id, estado: "active" });
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        message: "Sesión no encontrada",
      });
    }
    res.status(200).json({
      success: true,
      message: "Sesión obtenida exitosamente",
      data: sessionData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la sesión",
    });
  }
};

export const updateSession = async (req, res) => {
  try {
    const { wa_id } = req.params;
    const { estado } = req.body;
    const sessionData = await session.findOneAndUpdate(
      { wa_id, estado: "active" },
      { estado },
      { new: true },
    );
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        message: "Sesión no encontrada",
      });
    }
    res.status(200).json({
      success: true,
      message: "Sesión actualizada exitosamente",
      data: sessionData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la sesión",
    });
  }
};
