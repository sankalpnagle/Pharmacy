import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";

const app = next({ dev: process.env.NODE_ENV !== "production" });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  global.io = io;

  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);
    console.log("📊 Total connected clients:", io.engine.clientsCount);

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });

    // Log all events
    socket.onevent = (packet) => {
      const args = packet.data || [];
      if (args.length > 0) {
        console.log(`📨 Received event: ${args[0]}`);
      }
    };
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`✨ Server ready on http://localhost:${port}`);
    console.log(`🔌 Socket.io server running on http://localhost:${port}`);
  });
});
