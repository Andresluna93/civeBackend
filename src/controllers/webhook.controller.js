import ContactoCampana from "../models/contactoCampana.model.js";

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
                    const result = await ContactoCampana.updateMany(
                        { mensajeId: status.id },
                        { estadoEnvio: status.status },
                    );
                    console.log(
                        `status=${status.status} mensajeId=${status.id} matched=${result.matchedCount} modified=${result.modifiedCount}`,
                    );
                } catch (error) {
                    console.error("Error actualizando estado de mensaje:", error.message);
                }
            }
        }
    }
};
