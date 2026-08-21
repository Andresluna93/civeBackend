import mongoose from "mongoose";

const campanaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    templateName: { type: String, required: true },
    estado: {
      type: String,
      enum: ["borrador", "enviando", "completada", "fallida"],
      default: "borrador",
    },
    fechaEnvio: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Campana = mongoose.model("Campana", campanaSchema);
export default Campana;
