import React, { useState } from 'react';
import { VideoStream } from './components/VideoStream';
import { FaceManager } from './components/FaceManager';
import { ControlPanel } from './components/ControlPanel';
import { StatusBar } from './components/StatusBar';
import { Settings, Users, Monitor, Shield } from 'lucide-react';
import Footer from './components/Footer';

function App() {
  const [activeTab, setActiveTab] = useState<'stream' | 'faces' | 'settings'>('stream');
  const [streamUrl, setStreamUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [blurIntensity, setBlurIntensity] = useState(15);
  const [detectionConfidence, setDetectionConfidence] = useState(0.7);
  const [faceDatabase, setFaceDatabase] = useState<Array<{id: string, name: string, descriptor: Float32Array, image: string}>>([]);

  const tabs = [
    { id: 'stream', label: 'Live', icon: Monitor },
    { id: 'faces', label: 'Face Database', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white font-['Inter']">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1
              className="
                text-xl
                tracking-tight
                text-transparent
                bg-clip-text
                bg-gradient-to-r
                from-indigo-400
                font-montserrat
              "
            >
              ZKCAMERA
            </h1>
            {/* Optional subtitle below the name */}
            {/* <p className="text-sm text-gray-400">Realtime privacy. ZK powered.</p> */}
          </div>

          <StatusBar 
            isProcessing={isProcessing}
            faceCount={faceDatabase.length}
            streamConnected={!!streamUrl}
          />
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-800 px-6 border-b border-gray-700">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {activeTab === 'stream' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <VideoStream
                streamUrl={streamUrl}
                faceDatabase={faceDatabase}
                blurIntensity={blurIntensity}
                detectionConfidence={detectionConfidence}
                onProcessingChange={setIsProcessing}
                autoStart={streamUrl === 'webcam'}
              />
            </div>
            <div className="xl:col-span-1">
              <ControlPanel
                streamUrl={streamUrl}
                onStreamUrlChange={setStreamUrl}
                blurIntensity={blurIntensity}
                onBlurIntensityChange={setBlurIntensity}
                detectionConfidence={detectionConfidence}
                onDetectionConfidenceChange={setDetectionConfidence}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        )}

        {activeTab === 'faces' && (
          <FaceManager
            faceDatabase={faceDatabase}
            onFaceDatabaseChange={setFaceDatabase}
          />
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Application Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Processing Quality</label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>High Quality (Slower)</option>
                    <option>Balanced</option>
                    <option>Performance (Faster)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Privacy Mode</label>
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Enable local processing only (no external services)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Export Face Database</label>
                  <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">
                    Download Database
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;