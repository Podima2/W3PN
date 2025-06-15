# LiveBlur

A privacy-preserving, zero-knowledge face blurring system for livestreams and video. This project uses face recognition and zero-knowledge proofs (ZKPs) to blur only those faces that match a database, without ever revealing or storing raw facial data.

## Features

- Real-time face detection and blurring in livestreams or webcam video
- Face database with privacy: stores only quantized embeddings and ZK commitments
- Zero-knowledge proof-based matching: proves a face matches the database without revealing the embedding
- React frontend, Node.js/Express backend, Circom/snarkjs for ZK
- User-friendly UI for face enrollment, video streaming, and privacy management

## How It Works

1. **Enrollment:**
   - User uploads a face image.
   - The system extracts a face embedding, quantizes it, and stores a ZK commitment (hash) in the database.
2. **Livestream/Recognition:**
   - For each detected face in the video, a ZK proof is generated that the face matches a database entry (within a threshold).
   - The proof is verified (optionally on the server), and if valid, the face is blurred in the video.

## Tech Stack

- **Frontend:** React, face-api.js, snarkjs (for ZK proof generation)
- **Backend:** Node.js/Express, snarkjs (for ZK proof verification)
- **ZK Circuits:** Circom, Groth16

## Setup

### 1. Clone

```sh
git clone https://github.com/Podima2/W3PN
cd W3PN
```

### 2. Circuit Setup

```sh
cd circuits
chmod +x zk-setup.sh
./zk-setup.sh
```

- This will generate the necessary `.wasm`, `.zkey`, and `verification_key.json` files.
- Copy `FaceMatch_js/FaceMatch.wasm` and `FaceMatch_final.zkey` to your frontend `public/zk/FaceMatch_js/` directory.
- Copy `verification_key.json` to your backend `server/zk/` directory.

### 3. Run the App

- **Frontend:**
  ```sh
  npm run dev
  ```
- **Backend:**
  ```sh
  cd server
  npm install
  npm run start
  ```

## Usage

- Go to the app in your browser.
- Upload face images to enroll faces (quantized embeddings and ZK commitments are stored).
- Start a livestream or webcam.
- The app will blur faces in the video only if a ZK proof of a match is valid.

## Security & Privacy

- No raw face data is stored or transmitted.
- All matching is done via zero-knowledge proofs.
- Database stores only quantized embeddings and/or ZK commitments.

## License

MIT
