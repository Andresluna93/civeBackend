import winston from "winston";
import SlackHook from "winston-slack-webhook-transport";

const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(), // Railway logs
    new SlackHook({
      webhookUrl: process.env.SLACK_WEBHOOK_URL, // tu webhook de Slack
      level: "error", // solo envía errores
      formatter: (info) => ({
        text: `🚨 Error detectado:\n*Mensaje:* ${info.message}\n*Stack:* ${info.stack || "N/A"}`
      }),
    }),
  ],
});

export default logger;
