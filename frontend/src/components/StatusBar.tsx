import React from 'react';
import { Activity, Users, Wifi, WifiOff } from 'lucide-react';

interface StatusBarProps {
  isProcessing: boolean;
  faceCount: number;
  streamConnected: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isProcessing,
  faceCount,
  streamConnected
}) => {
  return (
    <div className="flex items-center space-x-6">
      {/* Processing Status */}
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          isProcessing ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
        }`}></div>
        <span className="text-sm text-gray-300">
          {isProcessing ? 'Processing' : 'Idle'}
        </span>
      </div>

      {/* Face Database Count */}
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-300">
          {faceCount} faces
        </span>
      </div>

      {/* Stream Connection */}
      <div className="flex items-center space-x-2">
        {streamConnected ? (
          <Wifi className="h-4 w-4 text-green-400" />
        ) : (
          <WifiOff className="h-4 w-4 text-gray-500" />
        )}
        <span className="text-sm text-gray-300">
          {streamConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* System Status */}
      <div className="flex items-center space-x-2">
        <Activity className="h-4 w-4 text-blue-400" />
        <span className="text-sm text-gray-300">
          Ready
        </span>
      </div>
    </div>
  );
};