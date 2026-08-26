import EstadoMensaje from "../models/estadoMensaje.model.js";
import axios from "axios";

export const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
};

export const receiveWebhook = async (req, res) => {
  // Responder rápido: Meta reintenta el evento si no confirmas 200 a tiempo.
  res.sendStatus(200);

  console.log("Webhook payload:", JSON.stringify(req.body, null, 2));

  const entries = req.body?.entry || [];
  const enviados = new Set();

  for (const entry of entries) {
    for (const change of entry.changes || []) {
      //const statuses = change.value?.statuses || [];
      const value = change.value || {};
      if (value.messages) {
        for (const message of value.messages || []) {
          if (enviados.has(message.id)) {
            console.log(`Mensaje ${message.id} ya reenviado, se omite`);
            continue;
          }
          enviados.add(message.id);

          const payload = {
            messaging_product: "whatsapp",
            metadata: value.metadata,
            contacts: value.contacts,
            messages: [message],
            field: change.field,
          };
          console.log("payload:", payload);

          try {
            const respuesta = await axios.post(
              "https://rluna1993.app.n8n.cloud/webhook/32d920ef-0c48-4ba4-b279-4fdeb7503c5c",
              payload,
              {
                headers: { "Content-Type": "application/json" },
              },
            );
            console.log(
              `n8n respondió status=${respuesta.status}`,
              respuesta.data,
            );
          } catch (error) {
            console.error(
              "Error reenviando a n8n:",
              error.response?.status,
              error.response?.data || error.message,
            );
          }
        }
      }

      if (value.statuses) {
        for (const status of value.statuses || []) {
          try {
            const registro = await EstadoMensaje.findOneAndUpdate(
              { mensajeId: status.id },
              {
                mensajeId: status.id,
                status: status.status,
                recipientId: status.recipient_id,
                conversationId: status.conversation?.id || null,
                categoria: status.conversation?.origin?.type || null,
                timestampMeta: new Date(Number(status.timestamp) * 1000),
              },
              { upsert: true, new: true, setDefaultsOnInsert: true },
            );

            console.log(
              `status=${registro.status} mensajeId=${registro.mensajeId}`,
            );
          } catch (error) {
            console.error(
              "Error guardando/enviando status:",
              error.response?.status,
              error.response?.data || error.message,
            );
          }
        }
      }
    }
  }
};
