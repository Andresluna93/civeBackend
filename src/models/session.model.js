import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    wa_id: { type: String, required: true },
    name: { type: String, required: true },
    estado: { type: String, required: true },
    date: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

const session = mongoose.model("Session", sessionSchema);
export default session;
