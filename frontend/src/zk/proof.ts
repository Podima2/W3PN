import { groth16 } from "snarkjs";

export async function generateProof(
  detectedEmbedding: number[],
  storedEmbedding: number[]
) {
  const input = {
    embedding1: detectedEmbedding,
    embedding2: storedEmbedding
  };
  // Adjust these paths if needed
  // const wasmPath = "/Users/maharajababu/Desktop/facerecog/src/zk/FaceMatch_js/FaceMatch.wasm";
  // const zkeyPath = '/Users/maharajababu/Desktop/facerecog/src/zk/FaceMatch_final.zkey';
  const wasmPath = "/zk/FaceMatch.wasm";
  const zkeyPath = "/zk/FaceMatch_final.zkey";
  return await groth16.fullProve(input, wasmPath, zkeyPath);
}