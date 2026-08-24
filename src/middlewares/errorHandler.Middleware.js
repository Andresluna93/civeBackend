import logger from "../services/logger.service.js";

export const errorHandler = (err, req, res, next) => {
  logger.error(err); // envía a consola y Slack

  res.status(err.status || 500).json({
    success: false,
    message: "Error interno del servidor",
  });
};
