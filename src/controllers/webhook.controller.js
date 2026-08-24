import EstadoMensaje from "../models/estadoMensaje.model.js";

export const verifyWebhook = (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }

    res.sendStatus(403);
};

export const receiveWebhook = async (req, res) => {
    // Responder rápido: Meta reintenta el evento si no confirmas 200 a tiempo.
    res.sendStatus(200);

    console.log("Webhook payload:", JSON.stringify(req.body, null, 2));

    const entries = req.body?.entry || [];

    for (const entry of entries) {
        for (const change of entry.changes || []) {
            const statuses = change.value?.statuses || [];

            for (const status of statuses) {
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

                    console.log(`status=${registro.status} mensajeId=${registro.mensajeId}`);
                } catch (error) {
                    console.error("Error actualizando estado de mensaje:", error.message);
                }
            }
        }
    }
};
