import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    nameUser: { type: String, required: true },
    password: { type: String, required: true },
    name: {type: String, required: true},
    role: { type: String, enum: ["admin", "contact"], default: "admin" },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const User = mongoose.model("User", userSchema);
export default User;
