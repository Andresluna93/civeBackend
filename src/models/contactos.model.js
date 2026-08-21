import mongoose from "mongoose";

const contactoSchema  = new mongoose.Schema(
    {
        nombres: { type: String, required: true },
        apellidos: { type: String, required: true },
        telefono : { type: String, required: true, unique: true },
        identificador : { type: String, default: null },
    }
,{
    timestamps: true,
    versionKey: false,
});

const Contacto = mongoose.model("Contacto", contactoSchema);
export default Contacto;