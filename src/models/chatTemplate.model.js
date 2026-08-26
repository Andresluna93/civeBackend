import mongoose from "mongoose";

const chatTemplateSchema = new mongoose.Schema({
    texto: { type: String, required: true },
    tipo: {
      type: String,
      enum: ["text", "image", "audio", "document", "sticker"],
      default: "text",
    },
    enviadoPor: { type: String, enum: ["cliente", "agente"], required: true },
    fecha: { type: Date, default: Date.now },
},{
    timestamps: true,
    versionKey: false,
  })

  const ChatTemplate = mongoose.model("ChatTemplate",chatTemplateSchema)
  export default ChatTemplate;