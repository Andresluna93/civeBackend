import mongoose from "mongoose";

const plantillaSchema = new mongoose.Schema(
  {
    metaId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    language: { type: String, required: true },
    status: { type: String, required: true },
    components: { type: mongoose.Schema.Types.Mixed, default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Plantilla = mongoose.model("Plantilla", plantillaSchema);
export default Plantilla;
