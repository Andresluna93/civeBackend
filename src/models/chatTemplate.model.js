import mongoose from "mongoose";

const chatTemplateSchema = new mongoose.Schema(
  {
    wa_id: { type: String, required: true, index: true },
    clientName: { type: String, required: true, index: true },
    client_text: { type: String, required: true },
    ia_text: { type: String, required: true },
    tipo: {
      type: String,
      enum: ["text", "image", "audio", "document", "sticker"],
      default: "text",
    },
    status: { type: String, default: "interactuaron" },
    fecha: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const ChatTemplate = mongoose.model("ChatTemplate", chatTemplateSchema);
export default ChatTemplate;
