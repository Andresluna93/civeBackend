import User from "../models/user.model.js";

export const getUser = async (req, res) => {
  const { nameUser, password } = req.body;
  try {
    const usuario = await User.findOne({ nameUser });

    if (!usuario) {
      return res
        .status(400)
        .json({ success: false, message: "Usuario no encontrado" });
    }
    if (usuario.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Contraseña Incorrecta" });
    }

    res
      .status(200)
      .json({ success: true, message: "Login Exitoso", data: usuario });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export const registerUser = async (req, res) => {
  const { nameUser, password, name, role } = req.body;

  if (!password || password === "") {
    return res
      .status(400)
      .json({ success: false, message: "La contraseña no puede estar vacía" });
  }

  try {
    const usuario = await User.create({ nameUser, password, name, role: role || undefined });
    res
      .status(201)
      .json({ success: true, message: "Registro exitoso", data: usuario });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error al registrar", data: err });
  }
};
