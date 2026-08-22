import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  const jwtsecret = process.env.JWT_SECRET;

  if (!token) {
    return res.status(401).json({ error: "token no encontrado" });
  }

  try {
    const decoded = jwt.verify(token, jwtsecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
}
