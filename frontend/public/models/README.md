# Face Detection Models

This directory should contain the face-api.js models for face detection and recognition.

To use this application with full functionality, you need to download the following models from the face-api.js repository:

1. `tiny_face_detector_model-weights_manifest.json`
2. `tiny_face_detector_model-shard1`
3. `face_landmark_68_model-weights_manifest.json`
4. `face_landmark_68_model-shard1`
5. `face_recognition_model-weights_manifest.json`
6. `face_recognition_model-shard1`
7. `face_recognition_model-shard2`

Download these files from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Place them in this `/public/models/` directory.

For development/demo purposes, the app includes fallback error handling when models are not available.