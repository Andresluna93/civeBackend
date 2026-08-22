import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getAllUsers = async (req, res) => {};

export const loginUser = async (req, res) => {
  const { nameUser, password } = req.body;
  const jwtsecret = process.env.JWT_SECRET;
  try {
    const usuario = await User.findOne({ nameUser });

    if (!usuario) {
      return res
        .status(400)
        .json({ success: false, message: "Usuario no encontrado" });
    }
    /*if (usuario.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Contraseña Incorrecta" });
    }*/
    const match = await bcrypt.compare(password, usuario.password);
    if (!match) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar token
    const token = jwt.sign(
      { name: usuario.name, role: usuario.role },
      jwtsecret,
      {
        expiresIn: "1h",
      },
    );

    // Guardar token en cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true en producción con HTTPS
    });

    res
      .status(200)
      .json({ success: true, message: "Login Exitoso", data: usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err });
  }
};

export const logoutUser = async (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Sesión cerrada correctamente" });
};

export const registerUser = async (req, res) => {
  const { nameUser, password, name, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  if (!password || password === "") {
    return res
      .status(400)
      .json({ success: false, message: "La contraseña no puede estar vacía" });
  }

  try {
    const usuario = await User.create({
      nameUser,
      password: hashedPassword,
      name,
      role: role || undefined,
    });
    res
      .status(201)
      .json({ success: true, message: "Registro exitoso", data: usuario });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error al registrar", data: err });
  }
};

export const dashboard = async (req, res) => {
  res.json({ name: req.user.name, role: req.user.role });
};
