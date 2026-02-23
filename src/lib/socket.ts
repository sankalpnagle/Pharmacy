"use client";

import { io } from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

console.log("🔌 Socket.io connecting to:", socketUrl);

export const socket = io(socketUrl, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ["websocket", "polling"],
});

// Connection status handlers
socket.on("connect", () => {
  console.log("✅ Socket connected successfully:", socket.id);
  console.log("🚀 Transport:", socket.io.engine.transport.name);
});

socket.on("disconnect", (reason) => {
  console.warn("❌ Socket disconnected. Reason:", reason);
});

socket.on("connect_error", (error) => {
  console.error("🔴 Socket connection error:", error);
});

socket.on("error", (error) => {
  console.error("🔴 Socket error:", error);
});

// Track transport upgrades
socket.io.engine.on("upgrade", (transport) => {
  console.log("🔄 Socket transport upgraded to:", transport.name);
});

// Log all emitted events (for debugging)
const originalEmit = socket.emit;
socket.emit = function (eventName: string, ...args: any[]) {
  console.log(`📤 Socket emitting: ${eventName}`, args);
  return originalEmit.apply(socket, [eventName, ...args]);
};
