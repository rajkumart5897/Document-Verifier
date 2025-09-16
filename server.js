const express = require("express");
const crypto = require("crypto");
const WebSocket = require("ws");
const multer = require("multer");
const fs = require("fs");
const http = require("http");
// Import Block and Blockchain from blockchain.js
const { Block, Blockchain } = require("./blockchain");

const upload = multer({ dest: "uploads/" });
const myChain = new Blockchain();
const uploadDir = "uploads";

// Helper to initialize blockchain from files
function initializeChainFromUploads() {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  const files = fs.readdirSync(uploadDir);
  files.forEach((filename) => {
    const filePath = `${uploadDir}/${filename}`;
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => {
      const fileHash = hash.digest("hex");
      const data = { filename, hash: fileHash };
      const block = new Block(
        myChain.chain.length,
        Date.now().toString(),
        data
      );
      myChain.addBlock(block);
    });
    // Wait for stream end before next file (optional for small files)
  });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// --- HTTP API ---

app.get("/chain", (req, res) => {
  res.json(myChain.chain);
});

app.post("/add", (req, res) => {
  const data = req.body.data || {};
  const block = new Block(myChain.chain.length, Date.now().toString(), data);
  myChain.addBlock(block);
  broadcast(JSON.stringify({ type: "NEW_BLOCK", block }));
  res.json({ message: "Block added", block });
});

app.get("/validate", (req, res) => {
  res.json({ valid: myChain.isValid() });
});

app.post("/verify", upload.single("file"), (req, res) => {
  let fileHash;
  if (req.file) {
    // Hash the uploaded file using stream for large files
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(req.file.path);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => {
      fileHash = hash.digest("hex");
      fs.unlinkSync(req.file.path);
      const found = myChain.chain.some(
        (b) => b.data && b.data.hash === fileHash
      );
      res.json({ verified: found });
    });
    stream.on("error", (err) => {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ error: "Error processing file" });
    });
  } else if (req.body.hash) {
    fileHash = req.body.hash;
    const found = myChain.chain.some((b) => b.data && b.data.hash === fileHash);
    res.json({ verified: found });
  } else {
    res.status(400).json({ error: "file or hash is required" });
  }
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "file is required" });
  }

  // Use stream for hashing large files
  const hash = crypto.createHash("sha256");
  const stream = fs.createReadStream(req.file.path);
  stream.on("data", (chunk) => hash.update(chunk));
  stream.on("end", () => {
    const fileHash = hash.digest("hex");
    const data = {
      filename: req.file.originalname,
      hash: fileHash,
    };
    const block = new Block(myChain.chain.length, Date.now().toString(), data);
    try {
      myChain.addBlock(block);
      broadcast(JSON.stringify({ type: "NEW_BLOCK", block }));
    } catch (e) {
      // Duplicate file hash, do not add block
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Duplicate file hash" });
    }

    // Move file to uploads folder with original name
    const targetPath = `uploads/${req.file.originalname}`;
    fs.rename(req.file.path, targetPath, (err) => {
      if (err) {
        return res.status(500).json({ error: "Error saving file" });
      }
      res.json({ message: "File uploaded and recorded", block });
    });
  });
  stream.on("error", (err) => {
    fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Error processing file" });
  });
});

// --- P2P Setup ---

const peers = [];
function connectToPeer(address) {
  const ws = new WebSocket(address);
  ws.on("open", () => {
    peers.push(ws);
    ws.send(JSON.stringify({ type: "CHAIN", chain: myChain.chain }));
  });
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    handleMessage(data);
  });
}

function broadcast(message) {
  peers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

function handleMessage(data) {
  if (data.type === "CHAIN") {
    if (
      data.chain.length > myChain.chain.length &&
      Blockchain.prototype.isValid.call({ chain: data.chain })
    ) {
      myChain.chain = data.chain;
    }
  } else if (data.type === "NEW_BLOCK") {
    const block = data.block;
    const latest = myChain.getLatestBlock();
    if (myChain.isNewBlockValid(block, latest)) {
      myChain.chain.push(Object.assign(new Block(), block));
    }
  }
}

const HTTP_PORT = process.env.HTTP_PORT || 3000;
// Remove P2P_PORT and use HTTP_PORT for both
const INITIAL_PEERS = (process.env.PEERS || "").split(",");

// Create HTTP server manually
const httpServer = http.createServer(app);

// Merge WebSocket server with HTTP server
const server = new WebSocket.Server({ server: httpServer });

server.on("connection", (ws) => {
  peers.push(ws);
  ws.send(JSON.stringify({ type: "CHAIN", chain: myChain.chain }));
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    handleMessage(data);
  });
});

// Listen with the HTTP server
httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP server running on http://localhost:${HTTP_PORT}`);
});

// Connect to initial peers as before
INITIAL_PEERS.filter((p) => p).forEach((p) => connectToPeer(p));

// Initialize blockchain from uploads folder before starting server
initializeChainFromUploads();
