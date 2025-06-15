import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Play, Pause, AlertCircle, Zap } from 'lucide-react';
import { generateProof } from '../zk/proof';
import { quantizeEmbedding } from '../zk/quantize';

interface VideoStreamProps {
  streamUrl: string;
  faceDatabase: Array<{ id: string; name: string; descriptor: Float32Array; image: string }>;
  blurIntensity: number;
  detectionConfidence: number;
  onProcessingChange: (processing: boolean) => void;
  autoStart?: boolean;
}

export const VideoStream: React.FC<VideoStreamProps> = ({
  streamUrl,
  faceDatabase,
  blurIntensity,
  detectionConfidence,
  onProcessingChange,
  autoStart = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  const lastDetectionsRef = useRef<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>>[]>([]);
  const provenPairs = useRef<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string>('');
  const [detectionStats, setDetectionStats] = useState({ fps: 0, facesDetected: 0, facesBlurred: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isMjpeg, setIsMjpeg] = useState(false);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector_model'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models/face_landmark_68_model'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models/face_recognition_model'),
        ]);
        setModelsLoaded(true);
        console.log('[face-api] Models loaded');
      } catch (err) {
        console.error('Model loading error:', err);
        setError('Failed to load face detection models');
      }
    };
    loadModels();
  }, []);

  // Detection cache loop
  useEffect(() => {
    if (!modelsLoaded || !videoRef.current) return;
    let stopped = false;
    const detectLoop = async () => {
      while (!stopped) {
        if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
          const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: detectionConfidence }))
            .withFaceLandmarks()
            .withFaceDescriptors();
          lastDetectionsRef.current = detections;
        }
        await new Promise(res => setTimeout(res, 200));
      }
    };
    detectLoop();
    return () => {
      stopped = true;
    };
  }, [modelsLoaded, detectionConfidence]);

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let blurredCount = 0;
    const detections = lastDetectionsRef.current;

    for (const detection of detections) {
      const { box } = detection.detection;
      let shouldBlur = false;

      if (faceDatabase.length > 0) {
        const faceDescriptor = quantizeEmbedding(Array.from(detection.descriptor));
        const descriptorKey = faceDescriptor.join(',');

        for (const knownFace of faceDatabase) {
          const cacheKey = `${descriptorKey}|${knownFace.id}`;

          // 🔁 Check cached matches first
          if (provenPairs.current.has(cacheKey)) {
            console.log('[ZK] Cache hit for:', cacheKey);
            shouldBlur = true;
            break;
          }

          // 🧠 Only generate proof if not cached
          try {
            console.log('[ZK] Generating proof for:', cacheKey);
            const { proof, publicSignals } = await generateProof(faceDescriptor, Array.from(knownFace.descriptor));

            if (publicSignals[0] === "1") {
              console.log('[ZK] Match confirmed, caching:', cacheKey);
              provenPairs.current.add(cacheKey);
              shouldBlur = true;
              break;
            }
          } catch (err) {
            console.error('[ZK] Proof generation error for', cacheKey, ':', err);
          }
        }
      }

      // 🌀 Blur logic
      if (shouldBlur) {
        const faceRegion = ctx.getImageData(box.x, box.y, box.width, box.height);

        const blurCanvas = document.createElement('canvas');
        blurCanvas.width = box.width;
        blurCanvas.height = box.height;
        const blurCtx = blurCanvas.getContext('2d');

        if (blurCtx) {
          blurCtx.putImageData(faceRegion, 0, 0);

          const filteredCanvas = document.createElement('canvas');
          filteredCanvas.width = box.width;
          filteredCanvas.height = box.height;
          const filteredCtx = filteredCanvas.getContext('2d');

          if (filteredCtx) {
            filteredCtx.filter = `blur(${blurIntensity || 8}px)`;
            filteredCtx.drawImage(blurCanvas, 0, 0);
            ctx.drawImage(filteredCanvas, box.x, box.y, box.width, box.height);
            console.log(`[BLUR] Applied blur at (${box.x}, ${box.y}, ${box.width}, ${box.height})`);
          }
        }

        blurredCount++;
      }

      // 🖼 Draw rectangle around face
      ctx.strokeStyle = shouldBlur ? '#ef4444' : '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    }

    setDetectionStats(ds => ({
      ...ds,
      facesBlurred: blurredCount,
      facesDetected: detections.length,
    }));
  }, [modelsLoaded, faceDatabase, detectionConfidence, blurIntensity]);

  useEffect(() => {
    if (isPlaying && modelsLoaded) {
      let lastProcessed = 0;
      const interval = 0; // ms between each processFrame
  
      const animate = () => {
        const now = Date.now();
        if (now - lastProcessed >= interval) {
          processFrame();
          lastProcessed = now;
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
      onProcessingChange(true);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      onProcessingChange(false);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, modelsLoaded, processFrame, onProcessingChange]);

  const startStream = async () => {
    if (!streamUrl) {
      setError('Please enter a stream URL');
      return;
    }
    try {
      setError('');
      if (streamUrl.startsWith('http')) {
        // Special handling for /video_feed (MJPEG)
        if (streamUrl.includes('/video_feed')) {
          setIsMjpeg(true);
          setIsPlaying(true);
        } else {
          setIsMjpeg(false);
          // For other HTTP/HTTPS streams (HLS, MP4, etc.)
          if (videoRef.current) {
            videoRef.current.src = streamUrl;
            videoRef.current.crossOrigin = 'anonymous';
            await videoRef.current.play();
            setIsPlaying(true);
          }
        }
      } else {
        setIsMjpeg(false);
        // For webcam or other MediaStream sources
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1920, height: 1080 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          streamRef.current = stream;
          setIsPlaying(true);
        }
      }
    } catch (err) {
      setError('Failed to start stream: ' + (err as Error).message);
    }
  };

  const stopStream = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      console.log('Canvas initialized at', videoRef.current.videoWidth, videoRef.current.videoHeight);
    }
  };

  useEffect(() => {
    if (autoStart && !isPlaying && modelsLoaded) {
      startStream();
    }
  }, [autoStart, modelsLoaded]);

  const startRecording = () => {
    if (!canvasRef.current) return;
    const stream = canvasRef.current.captureStream(30); // 30 FPS
    const mediaRecorder = new window.MediaRecorder(stream, { mimeType: 'video/webm' });
    recordedChunksRef.current = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      setRecordedUrl(URL.createObjectURL(blob));
    };
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleTakePhoto = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const image = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.href = image;
    link.download = 'photo.jpg';
    link.click();
  };

  const handleSubmitStreamUrl = async () => {
    if (!streamUrl) {
      setError('Please enter a stream URL');
      return;
    }
    try {
      setError('');
      await fetch('http://localhost:5001/set_stream_url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: streamUrl }),
      });
      if (videoRef.current) {
        videoRef.current.src = 'http://localhost:5001/video_feed';
        videoRef.current.crossOrigin = 'anonymous';
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError('Failed to submit stream URL: ' + (err as Error).message);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Live Stream</h2>
        <div className="flex items-center space-x-4">
          {modelsLoaded ? (
            <div className="flex items-center text-green-400 text-sm">
              <Zap className="h-4 w-4 mr-1" />
              Models Ready
            </div>
          ) : (
            <div className="flex items-center text-amber-400 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Loading Models...
            </div>
          )}
          <button
            onClick={isPlaying ? stopStream : startStream}
            disabled={!modelsLoaded}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isPlaying ? 'Stop' : 'Start'}</span>
          </button>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isPlaying}
            className={`flex items-center space-x-2 ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} px-4 py-2 rounded-lg transition-colors ml-2`}
          >
            {isRecording ? 'Stop Recording' : 'Record'}
          </button>
          {recordedUrl && (
            <a
              href={recordedUrl}
              download="recorded-stream.webm"
              className="ml-4 text-blue-400 underline"
            >
              Download Recording
            </a>
          )}
          <button
            onClick={handleTakePhoto}
            disabled={!isPlaying}
            className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg transition-colors ml-2"
          >
            Take Photo
          </button>
        </div>
      </div>

      <div className="relative aspect-video bg-black">
        {isMjpeg ? (
          <img
            src={streamUrl}
            alt="Live MJPEG Stream"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ zIndex: 1 }}
          />
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ opacity: 0 }}
            onLoadedMetadata={handleVideoLoadedMetadata}
            muted
            playsInline
          />
        )}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ zIndex: 10, pointerEvents: 'none' }}
        />
        {isPlaying && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 rounded-lg p-3 text-sm">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-gray-400">Detected</div>
                <div className="font-mono text-lg text-green-400">{detectionStats.facesDetected}</div>
              </div>
              <div>
                <div className="text-gray-400">Blurred</div>
                <div className="font-mono text-lg text-red-400">{detectionStats.facesBlurred}</div>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-600 text-white px-6 py-4 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}
        {!isPlaying && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Enter stream URL and click Start to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};