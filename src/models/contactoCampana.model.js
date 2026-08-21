import mongoose from "mongoose";

const contactoCampanaSchema = new mongoose.Schema(
  {
    contacto: { type: mongoose.Schema.Types.ObjectId, ref: "Contacto", required: true },
    campana: { type: mongoose.Schema.Types.ObjectId, ref: "Campana", required: true },
    estadoEnvio: {
      type: String,
      enum: ["pendiente", "enviado", "entregado", "leido", "fallido"],
      default: "pendiente",
    },
    mensajeId: { type: String, default: null },
    variables: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

contactoCampanaSchema.index({ contacto: 1, campana: 1 }, { unique: true });

const ContactoCampana = mongoose.model("ContactoCampana", contactoCampanaSchema);
export default ContactoCampana;
