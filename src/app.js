import express from "express";
import cors from "cors";
import morgan from "morgan";
import sessionRoutes from "./routes/session.route.js";
import chatRoutes from "./routes/chat.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import contactRoutes from "./routes/contact.route.js";
import userRoutes from "./routes/user.route.js";
import contactosRoutes from "./routes/contactos.route.js";
import campanasRoutes from "./routes/campana.route.js";
import webhookRoutes from "./routes/webhook.route.js";
import plantillaRoutes from "./routes/plantilla.route.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: [process.env.FRONTEND_URL].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use("/api/sessions", sessionRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/authUser", userRoutes);
app.use("/api/contactos", contactosRoutes);
app.use("/api/campanaMarketing", campanasRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/plantillas", plantillaRoutes);

export default app;
