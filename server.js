import dotenv from "dotenv";
import app from "./src/app.js";
import ConnectDB from "./src/config/database.js";

dotenv.config();
ConnectDB();

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("server is running on port " + PORT);
});
