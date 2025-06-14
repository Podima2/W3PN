import React, { useState, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { Upload, Trash2, User, Database, AlertCircle, Check } from 'lucide-react';
import { quantizeEmbedding } from '../zk/quantize';

interface FaceManagerProps {
  faceDatabase: Array<{id: string, name: string, descriptor: number[], image: string, commitment?: string}>;
  onFaceDatabaseChange: (database: Array<{id: string, name: string, descriptor: number[], image: string, commitment?: string}>) => void;
}
async function hashEmbedding(embedding: number[]): Promise<string> {
  const buffer = new Int32Array(embedding).buffer;
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const FaceManager: React.FC<FaceManagerProps> = ({
  faceDatabase,
  onFaceDatabaseChange
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File, name: string): Promise<{descriptor: number[], image: string, commitment: string} | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = async () => {
        if (!ctx) {
          resolve(null);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const detection = await faceapi
            .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection) {
            // Convert image to base64 for storage
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            // Quantize the embedding for ZK
            const quantized = quantizeEmbedding(Array.from(detection.descriptor));
            const commitment = await hashEmbedding(quantized);
            console.log('Quantized embedding:', quantized);
            console.log('ZK Commitment (SHA256):', commitment);
            resolve({
              descriptor: quantized,
              image: imageData,
              commitment
            });
          } else {
            resolve(null);
          }
        } catch (err) {
          console.error('Face processing error:', err);
          resolve(null);
        }
      };

      img.src = URL.createObjectURL(file);
    });
  };
  const handleFileSelect = async (files: FileList) => {
    setProcessing(true);
    setError('');

    const newFaces: Array<{id: string, name: string, descriptor: Float32Array, image: string}> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        continue;
      }

      const name = file.name.split('.')[0];
      const result = await processImage(file, name);
      
      if (result) {
        newFaces.push({
          id: Date.now() + i + '',
          name,
          descriptor: new Float32Array(result.descriptor),
          image: result.image
        });
      }
    }

    if (newFaces.length === 0) {
      setError('No faces detected in the uploaded images');
    } else {
      // Convert Float32Array descriptors to regular arrays before updating database
      const convertedFaces = newFaces.map(face => ({
        ...face,
        descriptor: Array.from(face.descriptor)
      }));
      onFaceDatabaseChange([...faceDatabase, ...convertedFaces]);
    }

    setProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFace = (id: string) => {
    onFaceDatabaseChange(faceDatabase.filter(face => face.id !== id));
  };

  const exportDatabase = () => {
    const dataStr = JSON.stringify(faceDatabase, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'face-database.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          // Convert descriptors to Float32Array
          const fixed = data.map(face => ({
            ...face,
            descriptor: new Float32Array(face.descriptor)
          }));
          onFaceDatabaseChange(fixed);
        }
      } catch (err) {
        setError('Invalid database file format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Face Database</h2>
          <p className="text-gray-400">Manage faces to be blurred in the livestream</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportDatabase}
            disabled={faceDatabase.length === 0}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
          >
            Export Database
          </button>
          <input
            type="file"
            accept=".json"
            onChange={importDatabase}
            className="hidden"
            id="import-db"
          />
          <label
            htmlFor="import-db"
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg cursor-pointer transition-colors"
          >
            Import Database
          </label>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-500 bg-opacity-10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        {processing ? (
          <div className="space-y-3">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-blue-400">Processing images...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium">Upload Face Images</p>
              <p className="text-gray-400">Drag & drop or click to select images</p>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: JPG, PNG, WebP
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Face Database */}
      <div className="bg-gray-800 rounded-xl">
        <div className="p-4 border-b border-gray-700 flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <h3 className="font-semibold">Stored Faces ({faceDatabase.length})</h3>
        </div>
        
        {faceDatabase.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No faces in database yet</p>
            <p className="text-sm">Upload images to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {faceDatabase.map((face) => (
              <div key={face.id} className="bg-gray-700 rounded-lg overflow-hidden group">
                <div className="aspect-square bg-gray-600 relative">
                  <img
                    src={face.image}
                    alt={face.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFace(face.id)}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-3">
                  <p className="font-medium truncate">{face.name}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Check className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-green-400">Processed</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};