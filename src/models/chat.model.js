import mongoose from "mongoose";

const mensajeSchema = new mongoose.Schema(
  {
    texto: { type: String, required: true },
    tipo: {
      type: String,
      enum: ["text", "image", "audio", "document", "sticker"],
      default: "text",
    },
    enviadoPor: { type: String, enum: ["cliente", "agente"], required: true },
    fecha: { type: Date, default: Date.now },
  },
  { _id: false },
);

const chatSchema = new mongoose.Schema(
  {
    wa_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    servicio: {
      type: String,
      enum: ["agendar_cita", "consultar_servicios"],
      default: null,
    },
    historial: { type: [mensajeSchema], default: [] },
    estado: {
      type: String,
      enum: ["ingresado", "en_proceso", "finalizada", "abandono"],
      default: "en_proceso",
    },
    sucursal: { type: String, default: null },
    fecha_fin: { type: Date, default: null },
    horario_laboral: { type: Boolean, default: false },
    first_recordatorio: { type: Boolean, default: false },
    second_recordatorio: { type: Boolean, default: false },
    ultimoMensaje: { type: mensajeSchema, default: null },
    noLeidos: { type: Number, default: 0 },
    ticket: { type: String, default: null, unique: true, sparse: true },
    requeriment: { type: String, default: null },
    observacion: { type: String, default: null },
    status: {
      v: { type: String, default: null },
      date: { type: Date, default: null },
      hora: { type: String, default: null },
    },
    statusH: {
      type: [
        {
          v: { type: String },
          date: { type: Date },
          hora: { type: String },
          _id: false,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
