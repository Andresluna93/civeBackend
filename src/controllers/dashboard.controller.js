import chat from "../models/chat.model.js";

export const getDurationChats = async (req, res) => {
  try {
    const chats = await chat.find({ estado: "en_proceso" });
    const durations = chats.map((chat) => {
      const startTime = chat.createdAt;
      const endTime = chat.fecha_fin;
      const duration = endTime
        ? (endTime - startTime) / 1000
        : (Date.now() - startTime) / 1000;
      return {
        wa_id: chat.wa_id,
        name: chat.name,
        duracion_minutos: parseFloat((duration / 60).toFixed(2)),
      };
    });
    const valores = durations.map((d) => d.duracion_minutos);
    const stats = durations.length
      ? {
          maximo: Math.max(...valores),
          minimo: Math.min(...valores),
          promedio: parseFloat(
            (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2),
          ),
        }
      : null;

    res.status(200).json({
      success: true,
      message: "Duración de los chats obtenida correctamente",
      data: { chats: durations, stats },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener la duración del chat",
      data: error,
    });
  }
};

export const getStartedChats = async (req, res) => {
  const { periodo, fecha, anio, mes, semana } = req.query; // "dia", "semana", "mes"
  const now = new Date();
  let start, end;

  if (periodo === "dia") {
    const target = fecha ? new Date(fecha) : now;
    start = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
      0,
      0,
      0,
      0,
    );
    end = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
      23,
      59,
      59,
      999,
    );
  } else if (periodo === "mes") {
    const y = anio ? parseInt(anio) : now.getFullYear();
    const m = mes ? parseInt(mes) - 1 : now.getMonth();
    start = new Date(y, m, 1);
    end = new Date(y, m + 1, 0, 23, 59, 59, 999);
  } else if (periodo === "semana") {
    let baseDate;
    if (semana && anio) {
      // Calcular el lunes de la semana ISO indicada
      const jan4 = new Date(parseInt(anio), 0, 4);
      const dow = (jan4.getDay() + 6) % 7;
      baseDate = new Date(jan4);
      baseDate.setDate(jan4.getDate() - dow + (parseInt(semana) - 1) * 7);
    } else {
      // Lunes de la semana actual
      const dow = (now.getDay() + 6) % 7;
      baseDate = new Date(now);
      baseDate.setDate(now.getDate() - dow);
    }
    start = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      0,
      0,
      0,
      0,
    );
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  }

  /*const groupFormats = {
    dia:    { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } },
    semana: { year: { $year: "$createdAt" }, week: { $week: "$createdAt" } },
    mes:    { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
  };

  const groupBy = groupFormats[periodo] ?? groupFormats.dia;*/

  const groupStage =
    periodo === "dia"
      ? {
          _id: { $hour: { date: "$updatedAt", timezone: "America/Guayaquil" } },
          total: { $sum: 1 },
        }
      : {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$updatedAt",
              timezone: "America/Guayaquil",
            },
          },
          total: { $sum: 1 },
        };

  try {
    const [totales, desglose] = await Promise.all([
      chat.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: 1 } } },
      ]),
      chat.aggregate([
        { $match: { updatedAt: { $gte: start, $lte: end } } },
        { $group: groupStage },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const total = totales[0]?.total ?? 0;
    let informacion;

    const mapaDias = Object.fromEntries(desglose.map((r) => [r._id, r.total]));

    if (periodo === "dia") {
      informacion = Array.from({ length: 12 }, (_, i) => {
        const h = 8 + i;
        return { hora: `${h}:00`, total: mapaDias[h] ?? 0 };
      });
    } else if (periodo === "semana") {
      informacion = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        return { hora: key, total: mapaDias[key] ?? 0 };
      });
    } else if (periodo === "mes") {
      const diasEnMes = new Date(
        end.getFullYear(),
        end.getMonth() + 1,
        0,
      ).getDate();
      informacion = Array.from({ length: diasEnMes }, (_, i) => {
        const d = new Date(start.getFullYear(), start.getMonth(), i + 1);
        const key = d.toISOString().slice(0, 10);
        return { hora: key, total: mapaDias[key] ?? 0 };
      });
    }

    res.status(200).json({
      success: true,
      data: { periodo, total, informacion },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener los chats iniciados",
      data: error,
    });
  }
};

export const getChatsByEstado = async (req, res) => {
  const { periodo, fecha, anio, mes, semana } = req.query;
  const now = new Date();
  let start, end;

  if (periodo === "dia") {
    const target = fecha ? new Date(fecha) : now;
    start = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
      0,
      0,
      0,
      0,
    );
    end = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
      23,
      59,
      59,
      999,
    );
  } else if (periodo === "mes") {
    const y = anio ? parseInt(anio) : now.getFullYear();
    const m = mes ? parseInt(mes) - 1 : now.getMonth();
    start = new Date(y, m, 1);
    end = new Date(y, m + 1, 0, 23, 59, 59, 999);
  } else if (periodo === "semana") {
    let baseDate;
    if (semana && anio) {
      const jan4 = new Date(parseInt(anio), 0, 4);
      const dow = (jan4.getDay() + 6) % 7;
      baseDate = new Date(jan4);
      baseDate.setDate(jan4.getDate() - dow + (parseInt(semana) - 1) * 7);
    } else {
      const dow = (now.getDay() + 6) % 7;
      baseDate = new Date(now);
      baseDate.setDate(now.getDate() - dow);
    }
    start = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      0,
      0,
      0,
      0,
    );
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  }

  try {
    const resultado = await chat.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: "$estado", total: { $sum: 1 } } },
    ]);

    const categorias = {
      ingresado: 0,
      en_proceso: 0,
      finalizado: 0,
      abandono: 0,
    };
    resultado.forEach((r) => {
      if (r._id in categorias) categorias[r._id] = r.total;
    });

    res.status(200).json({
      success: true,
      data: { periodo, ...categorias },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener los chats por estado",
      data: error,
    });
  }
};

export const getSucursalChats = async (req, res) => {
  try {
    const resultado = await chat.aggregate([
      { $match: { sucursal: { $ne: null } } },
      { $group: { _id: "$sucursal", total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const data = resultado.map((r) => ({ sucursal: r._id, total: r.total }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener los chats por sucursal",
      data: error,
    });
  }
};
