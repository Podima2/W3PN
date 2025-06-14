import React from 'react';
import { Settings, Sliders, Target, Globe } from 'lucide-react';

interface ControlPanelProps {
  streamUrl: string;
  onStreamUrlChange: (url: string) => void;
  blurIntensity: number;
  onBlurIntensityChange: (intensity: number) => void;
  detectionConfidence: number;
  onDetectionConfidenceChange: (confidence: number) => void;
  isProcessing: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  streamUrl,
  onStreamUrlChange,
  blurIntensity,
  onBlurIntensityChange,
  detectionConfidence,
  onDetectionConfidenceChange,
  isProcessing
}) => {
  const handleStreamUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleWebcamAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Clean up the stream immediately, we just needed to trigger permission
      stream.getTracks().forEach(track => track.stop());
      onStreamUrlChange('webcam');
    } catch (err) {
      console.error('Webcam access denied:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stream Configuration */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Globe className="h-5 w-5" />
          <h3 className="font-semibold">Stream Source</h3>
        </div>
        
        <form onSubmit={handleStreamUrlSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">
              Stream URL or Source
            </label>
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => onStreamUrlChange(e.target.value)}
              placeholder="https://example.com/stream.m3u8"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleWebcamAccess}
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Use Webcam
            </button>
          </div>
        </form>
        
        <div className="mt-3 text-xs text-gray-400">
          <p>Supported: HTTP/HTTPS streams, Webcam, RTMP, HLS</p>
        </div>
      </div>

      {/* Processing Controls */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Sliders className="h-5 w-5" />
          <h3 className="font-semibold">Processing Controls</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Blur Intensity: {blurIntensity}px
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={blurIntensity}
              onChange={(e) => onBlurIntensityChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none slider"
              disabled={isProcessing}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Light</span>
              <span>Heavy</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Detection Confidence: {Math.round(detectionConfidence * 100)}%
            </label>
            <input
              type="range"
              min="0.3"
              max="0.9"
              step="0.05"
              value={detectionConfidence}
              onChange={(e) => onDetectionConfidenceChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none slider"
              disabled={isProcessing}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Sensitive</span>
              <span>Strict</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="h-5 w-5" />
          <h3 className="font-semibold">Performance</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Processing Status</span>
            <span className={`text-sm font-medium ${
              isProcessing ? 'text-green-400' : 'text-gray-400'
            }`}>
              {isProcessing ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">GPU Acceleration</span>
            <span className="text-sm font-medium text-amber-400">
              WebGL
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Privacy Mode</span>
            <span className="text-sm font-medium text-green-400">
              Local Only
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-5 w-5" />
          <h3 className="font-semibold">Quick Actions</h3>
        </div>
        
        <div className="space-y-2">
          <button className="w-full bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors text-left">
            Reset to Defaults
          </button>
          <button className="w-full bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors text-left">
            Clear Detection Cache
          </button>
          <button className="w-full bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors text-left">
            Calibrate Detection
          </button>
        </div>
      </div>
    </div>
  );
};