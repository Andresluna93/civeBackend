import chat from "../models/chat.model.js";

const generarTicket = (id) => {
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const sufijo = id.toString().slice(-6).toUpperCase();
  return `${fecha}-${sufijo}`;
};

const esDentroHorario = () => {
  const hora = parseInt(
    new Intl.DateTimeFormat("es-EC", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Guayaquil",
    }).format(new Date()),
  );
  return hora >= 1 && hora < 17;
};

export const createChat = async (req, res) => {
  const {
    wa_id,
    name,
    servicio,
    fecha_fin,
    texto,
    tipo,
    enviadoPor,
    sucursal,
    status,
    estado,
    canal,
    cedula,
  } = req.body;
  try {
    const mensaje = { texto, tipo, enviadoPor, fecha: new Date() };
    const statusArray = { v: status.v, date: status.date, hora: status.hora };
    const dentroHorario = esDentroHorario();
    const newId = new mongoose.Types.ObjectId();
    const ticket = generarTicket(newId);
    let newChat;

    if (dentroHorario) {
      newChat = await chat.findOneAndUpdate(
        { wa_id, estado: estado },
        {
          $setOnInsert: { _id: newId, name, horario_laboral: true, ticket },
          $push: { historial: mensaje, statusH: statusArray },
          $set: {
            ultimoMensaje: mensaje,
            servicio,
            fecha_fin,
            sucursal,
            status,
            canal,
            cedula,
          },
          $inc: { noLeidos: enviadoPor === "cliente" ? 1 : 0 },
        },
        { new: true, upsert: true },
      );
    } else {
      newChat = await chat.findOneAndUpdate(
        { wa_id, estado: estado },
        {
          $setOnInsert: {
            _id: newId,
            name,
            horario_laboral: false,
            first_recordatorio: false,
            ticket,
          },
          $push: { historial: mensaje },
          $set: {
            ultimoMensaje: mensaje,
            servicio,
            sucursal,
            estado: "abandono",
            fecha_fin: new Date(),
            canal,
            cedula,
          },
          $inc: { noLeidos: enviadoPor === "cliente" ? 1 : 0 },
        },
        { new: true, upsert: true },
      );
    }

    res.status(201).json({
      success: true,
      message: "Chat creado exitosamente",
      data: newChat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear el chat",
      data: error,
    });
  }
};

export const getChats = async (req, res) => {
  try {
    const chats = await chat.find();
    res.status(200).json({
      success: true,
      message: "Chats obtenidos exitosamente",
      data: chats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener los chats",
      data: error,
    });
  }
};

export const getChatByWaId = async (req, res) => {
  const { wa_id } = req.params;
  try {
    const foundChat = await chat.findOne({ wa_id, estado: "ingresado" });
    if (!foundChat) {
      return res.status(404).json({
        success: false,
        message: "Chat no encontrado",
      });
    }
    res.status(200).json({
      success: true,
      message: "Chat obtenido exitosamente",
      data: foundChat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener el chat",
      data: error,
    });
  }
};

export const updateStateChat = async (req, res) => {
  const { wa_id } = req.params;
  const { estado } = req.body;
  try {
    const update = {
      estado,
    };

    const updatedChat = await chat.findOneAndUpdate(
      { wa_id, estado: "en_proceso" },
      update,
      { new: true },
    );
    res.status(200).json({
      success: true,
      message: "Estado del chat actualizado exitosamente",
      data: updatedChat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar el estado delchat",
      data: error,
    });
  }
};

export const sweepAbandonedChats = async (req, res) => {
  try {
    let resultado;
    const dentroHorario = esDentroHorario();
    const fifteenMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Encuentra el último mensaje del cliente por chat y filtra los que superaron 15 min
    const candidatos = await chat.aggregate([
      { $match: { estado: "en_proceso" } },
      {
        $addFields: {
          ultimoMsgCliente: {
            $last: {
              $filter: {
                input: "$historial",
                as: "msg",
                cond: { $eq: ["$$msg.enviadoPor", "cliente"] },
              },
            },
          },
        },
      },
      {
        $match: {
          "ultimoMsgCliente.fecha": { $lt: fifteenMinutesAgo },
        },
      },
      { $project: { _id: 1, wa_id: 1, name: 1, ultimoMsgCliente: 1 } },
    ]);

    const ids = candidatos.map((c) => c._id);

    if (dentroHorario) {
      resultado = await chat.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            estado: "abandono",
            first_recordatorio: true,
            fecha_fin: new Date(),
          },
        },
      );
    } else {
      resultado = await chat.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            estado: "abandono",
            horario_laboral: false,
            first_recordatorio: true,
            fecha_fin: new Date(),
          },
        },
      );
    }

    res.status(200).json({
      success: true,
      message: "Barrido completado",
      data: {
        candidatos: candidatos,
        chatsActualizados: resultado.modifiedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error en el barrido de chats abandonados",
      data: error,
    });
  }
};

export const sweepAbandonedChatsAgain = async (req, res) => {
  try {
    let resultado;
    const dentroHorario = esDentroHorario();
    const fifteenMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Encuentra el último mensaje del cliente por chat y filtra los que superaron 15 min
    const candidatos = await chat.aggregate([
      { $match: { estado: "en_proceso" } },
      {
        $addFields: {
          ultimoMsgCliente: {
            $last: {
              $filter: {
                input: "$historial",
                as: "msg",
                cond: { $eq: ["$$msg.enviadoPor", "cliente"] },
              },
            },
          },
        },
      },
      {
        $match: {
          "ultimoMsgCliente.fecha": { $lt: fifteenMinutesAgo },
        },
      },
      { $project: { _id: 1, wa_id: 1, name: 1, ultimoMsgCliente: 1 } },
    ]);

    const ids = candidatos.map((c) => c._id);

    if (dentroHorario) {
      resultado = await chat.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            estado: "abandono",
            horario_laboral: true,
            second_recordatorio: true,
            fecha_fin: new Date(),
          },
        },
      );
    } else {
      resultado = await chat.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            estado: "abandono",
            horario_laboral: false,
            second_recordatorio: true,
            fecha_fin: new Date(),
          },
        },
      );
    }

    res.status(200).json({
      success: true,
      message: "Barrido completado",
      data: {
        candidatos: candidatos,
        chatsActualizados: resultado.modifiedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error en el barrido de chats abandonados",
      data: error,
    });
  }
};

export const updateChatHistorial = async (req, res) => {
  const {
    id,
    texto,
    tipo,
    enviadoPor,
    requeriment,
    estado,
    status,
    servicio,
    sucursal,
  } = req.body;
  try {
    const mensaje = { texto, tipo, enviadoPor, fecha: new Date() };

    const pushFields = { historial: mensaje };
    if (status)
      pushFields.statusH = {
        v: status.v,
        date: status.date,
        hora: status.hora,
      };

    const updatedChat = await chat.findByIdAndUpdate(
      id,
      {
        $push: pushFields,
        $set: {
          ultimoMensaje: mensaje,
          ...(estado !== undefined && { estado }),
          ...(requeriment !== undefined && { requeriment }),
          ...(status !== undefined && { status }),
          ...(sucursal !== undefined && { sucursal }),
          servicio,
        },
        $inc: { noLeidos: enviadoPor === "cliente" ? 1 : 0 },
      },
      { new: true },
    );

    if (!updatedChat) {
      return res.status(404).json({
        success: false,
        message: "Chat no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Historial actualizado exitosamente",
      data: updatedChat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar el historial",
      data: error,
    });
  }
};

export const updateChat = async (req, res) => {
  const {
    wa_id,
    name,
    servicio,
    fecha_fin,
    texto,
    tipo,
    enviadoPor,
    sucursal,
  } = req.body;
  try {
    const mensaje = { texto, tipo, enviadoPor, fecha: new Date() };
    const dentroHorario = esDentroHorario();
    let newChat;

    if (dentroHorario) {
      newChat = await chat.findOneAndUpdate(
        { wa_id, estado: "ingresado" },
        {
          $setOnInsert: { name, horario_laboral: true },
          $push: { historial: mensaje },
          $set: {
            ultimoMensaje: mensaje,
            servicio,
            fecha_fin,
            sucursal,
          },
          $inc: { noLeidos: enviadoPor === "cliente" ? 1 : 0 },
        },
        { new: true, upsert: true },
      );
    } else {
      newChat = await chat.findOneAndUpdate(
        { wa_id, estado: "ingresado" },
        {
          $setOnInsert: {
            name,
            horario_laboral: false,
            first_recordatorio: false,
          },
          $push: { historial: mensaje },
          $set: {
            ultimoMensaje: mensaje,
            servicio,
            sucursal,
            estado: "abandono",
            fecha_fin: new Date(),
          },
          $inc: { noLeidos: enviadoPor === "cliente" ? 1 : 0 },
        },
        { new: true, upsert: true },
      );
    }

    res.status(201).json({
      success: true,
      message: "Chat creado exitosamente",
      data: newChat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear el chat",
      data: error,
    });
  }
};

export const updateStatusChat = async (req, res) => {
  const { estado, requeriment, id, status, observacion } = req.body;
  const statusObj = { v: status.v, date: status.date, hora: status.hora };
  try {
    const updateStatus = await chat.findByIdAndUpdate(
      id,
      {
        $set: {
          estado,
          requeriment,
          observacion,
          status,
        },
        $push: { statusH: statusObj },
      },
      { new: true },
    );
    res.status(200).json({
      success: true,
      message: "Estado del chat actualizado exitosamente",
      data: updateStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar el estado del chat",
      data: error,
    });
  }
};
