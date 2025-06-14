import express from "express";
import { groth16 } from "snarkjs";
import verificationKey from "./verification_key.json" assert { type: "json" };
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load circuit files
const wasmPath = path.join(__dirname, "FaceMatch.wasm");
const zkeyPath = path.join(__dirname, "FaceMatch_final.zkey");

// Load your face database (quantized embeddings)
import faceDatabase from "../db/faces.json" assert { type: "json" };

const app = express();
app.use(express.json());

app.post("/api/zk-match", async (req, res) => {
  const { embedding } = req.body; // quantized embedding from frontend

  for (const knownFace of faceDatabase) {
    try {
      const input = {
        embedding1: embedding,
        embedding2: knownFace.descriptor
      };
      const { proof, publicSignals } = await groth16.fullProve(
        input,
        wasmPath,
        zkeyPath
      );
      const isValid = await groth16.verify(verificationKey, publicSignals, proof);
      if (isValid && publicSignals[0] === "1") {
        return res.json({ match: true, id: knownFace.id });
      }
    } catch (err) {
      console.error("ZK proof error:", err);
    }
  }
  res.json({ match: false });
});

app.post("/api/add-face", async (req, res) => {
  const { id, descriptor } = req.body;
  if (!id || !descriptor) {
    return res.status(400).json({ error: "Missing id or descriptor" });
  }
  try {
    // Read the current database
    const dbPath = path.join(__dirname, "../db/faces.json");
    const data = await fs.promises.readFile(dbPath, "utf-8");
    const faces = JSON.parse(data);
    // Add the new face
    faces.push({ id, descriptor });
    // Write back to the file
    await fs.promises.writeFile(dbPath, JSON.stringify(faces, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error("Error adding face:", err);
    res.status(500).json({ error: "Failed to add face" });
  }
});

app.listen(3001, () => console.log("ZK Face Blur server running on port 3001"));