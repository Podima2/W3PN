#!/bin/bash
set -e

CIRCUIT=FaceMatch
PTAU=pot12_final.ptau
CIRCOMLIB_PATH="/Users/maharajababu/Desktop/facerecog/circuits/circomlib"

# Clean up old files
rm -f $CIRCUIT.r1cs $CIRCUIT.wasm $CIRCUIT.sym $CIRCUIT.c $CIRCUIT_0000.zkey $CIRCUIT_final.zkey verification_key.json pot12_0000.ptau pot12_0001.ptau $PTAU

# 1. Generate Powers of Tau (if not exists)
if [ ! -f pot12_0000.ptau ]; then
  echo "Generating new powers of tau..."
  snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
fi

# 2. Contribute to ceremony
if [ ! -f pot12_0001.ptau ]; then
  echo "Contributing to powers of tau..."
  snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
fi

# 3. Prepare phase2
if [ ! -f $PTAU ]; then
  echo "Preparing phase2..."
  snarkjs powersoftau prepare phase2 pot12_0001.ptau $PTAU -v
fi

# 4. Compile the circuit (with correct include path)
echo "Compiling circuit..."
circom $CIRCUIT.circom --r1cs --wasm --sym --c -l $CIRCOMLIB_PATH

# 5. Groth16 setup
echo "Running Groth16 setup..."
snarkjs groth16 setup $CIRCUIT.r1cs $PTAU ${CIRCUIT}_0000.zkey

# 6. Contribute to phase2
echo "Contributing to phase2..."
snarkjs zkey contribute ${CIRCUIT}_0000.zkey ${CIRCUIT}_final.zkey --name="1st Contributor"

# 7. Export verification key
echo "Exporting verification key..."
snarkjs zkey export verificationkey ${CIRCUIT}_final.zkey verification_key.json

echo "All done!"