import mongoose from "mongoose";

const estadoMensajeSchema = new mongoose.Schema(
  {
    //wabaId: { type: String, required: true },
    mensajeId: { type: String, required: true },
    plantilla: { type: mongoose.Schema.Types.ObjectId, ref: "Plantilla", required: true },
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      required: true,
    },
    recipientId: { type: String, required: true },
    conversationId: { type: String, default: null },
    categoria: { type: String, default: null },
    timestampMeta: { type: Date, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

estadoMensajeSchema.index({ mensajeId: 1 }, { unique: true });

const EstadoMensaje = mongoose.model("EstadoMensaje", estadoMensajeSchema);
export default EstadoMensaje;
