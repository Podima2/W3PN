 # Zero-Knowledge Face Blurring in zkFaceBlur

zkFaceBlur uses zero-knowledge proofs (ZKPs) to ensure that face matching and blurring are performed without ever revealing or storing raw facial data.

## How It Works

### 1. Enrollment (Private Face Storage)
- When a user uploads a face image, the system extracts a face embedding (a vector of numbers).
- The embedding is quantized (converted to integers) and a cryptographic hash (commitment) is created.
- Only the quantized embedding or its hash is stored in the database—never the original image or raw embedding.

### 2. Recognition (Zero-Knowledge Matching)
- For each detected face in a video frame, the system extracts and quantizes the embedding.
- Using a zero-knowledge circuit (written in Circom), the system generates a ZK proof that the new embedding is “close enough” to a stored embedding (i.e., it matches a face in the database) **without revealing the embedding itself**.
- The proof is sent to the backend, which verifies it using snarkjs and the verification key.
- If the proof is valid, the face is blurred in the video.

## Why is this Private?
- The server (and anyone else) never sees the actual face data—only the ZK proof and the commitment.
- The proof only reveals that a match exists, not which face or what the embedding is.

## Tech Used
- **Circom**: For writing the ZK circuit that checks face similarity.
- **snarkjs**: For generating and verifying ZK proofs.
- **face-api.js**: For extracting face embeddings in the browser.

---

**In summary:**
zkFaceBlur lets you prove a face matches a database entry and blur it—**without ever exposing the face data itself**.
