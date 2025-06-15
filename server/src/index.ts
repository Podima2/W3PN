import express from "express";
import { groth16 } from "snarkjs";
import verificationKey from "./zk/verification_key.json";
import fs from "fs";
import path from "path";

const wasmPath = path.join(__dirname, "zk/FaceMatch_js/FaceMatch.wasm");
const zkeyPath = path.join(__dirname, "zk/FaceMatch_final.zkey");
const dbPath = path.join(__dirname, "../../db/faces.json");

function loadFaceDatabase() {
  if (fs.existsSync(dbPath)) {
    return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  }
  return [];
}
function saveFaceDatabase(db: any) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

let faceDatabase = loadFaceDatabase();

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

// API to add a new face
app.post("/api/add-face", (req, res) => {
  const { id, name, descriptor, commitment, image } = req.body;
  if (!id || !name || !descriptor || !Array.isArray(descriptor)) {
    return res.status(400).json({ error: "Missing or invalid face data" });
  }
  const newFace = { id, name, descriptor, commitment, image };
  faceDatabase.push(newFace);
  saveFaceDatabase(faceDatabase);
  res.json({ success: true, face: newFace });
});

app.listen(3001, () => console.log("ZK Face Blur server running on port 3001")); 