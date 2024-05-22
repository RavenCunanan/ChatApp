// imports required for server
import { uniqueNamesGenerator, colors, names } from "unique-names-generator";
import express from "express";
import http from "http";
import { Server } from "socket.io";

// initializing the servers: HTTP as well as Web Socket
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Chat history stored in-memory (consider using a database for persistence)
const chatHistory = [];

// Serve static assets from the 'frontend' directory
app.use(express.static(process.cwd() + "/frontend"));

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/frontend/index.html");
});

// Helper function to get all messages in reverse order
function getAllMessages() {
  return Array.from(chatHistory).reverse();
}

// Helper function to generate a unique username
function getUniqueUsername() {
  return uniqueNamesGenerator({
    dictionaries: [names, colors],
    length: 2,
    style: "capital",
    separator: " ",
  });
}

// Handle new WebSocket connections
io.on("connection", (socket) => {
  const username = getUniqueUsername();
  console.log(`${username} connected`);

  // Send the current chat history and username to the newly connected client
  socket.emit("receive-messages", {
    chatHistory: getAllMessages(),
    username,
  });

  // Listen for new messages from the client
  socket.on("post-message", (data) => {
    const { message } = data || { message: "" };

    // Basic sanitization of the message
    const sanitizedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    if (sanitizedMessage.trim()) {
      console.log(sanitizedMessage);
      chatHistory.push({ username, message: sanitizedMessage });

      // Broadcast the updated chat history to all clients
      io.emit("receive-messages", {
        chatHistory: getAllMessages(),
      });
    }
  });

  // Handle client disconnections
  socket.on("disconnect", () => {
    console.log(`${username} disconnected`);
  });
});

// Start the HTTP server
server.listen(3000, () => {
  console.log("listening on http://localhost:3000");
});
