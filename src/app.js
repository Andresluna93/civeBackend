import express from "express";
import cors from "cors";
import morgan from "morgan";
import sessionRoutes from "./routes/session.route.js";
import chatRoutes from "./routes/chat.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import contactRoutes from "./routes/contact.route.js";

const app = express();

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use("/api/sessions", sessionRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/contacts", contactRoutes);

export default app;
