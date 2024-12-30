import express from "express";
import cors from "cors";
import { WebSocket } from "ws";
import * as dotenv from "dotenv";

import v1Router from "@/routes/v1";
import { defaultController } from "@/controllers";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", defaultController);
app.use("/api/v1", v1Router);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});

export const wss = new WebSocket.Server({ server });

wss.on("connection", async function (socket) {
  console.log("Connected");
  socket.send("Client connected");
  socket.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      if (parsedMessage.method) {
        socket.send(parsedMessage.method);
      } else {
        socket.send("Please provide valid method name");
      }
    } catch (e: any) {
      if (e.message.includes("JSON"))
        socket.send("Please provide valid method ");
      else socket.send(e.message);
    }
  });
});
