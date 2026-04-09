
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cpu, Link, Link2Off, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DeviceManagerProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onReset: () => void;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({ isConnected, onConnect, onDisconnect, onReset }) => {
  return (
    <div className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 p-2 pl-4 rounded-full">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Cpu className={`w-5 h-5 ${isConnected ? 'text-emerald-400' : 'text-zinc-600'}`} />
          {isConnected && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-tighter text-zinc-500 leading-none">Status</span>
          <span className={`text-xs font-mono ${isConnected ? 'text-emerald-400' : 'text-zinc-400'}`}>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      <div className="h-8 w-[1px] bg-zinc-800 mx-2" />

      <AnimatePresence mode="wait">
        {isConnected ? (
          <motion.div
            key="disconnect"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-1"
          >
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onReset}
              className="h-8 rounded-full text-zinc-400 hover:text-amber-400 hover:bg-amber-900/10"
              title="Stop current script / Reset REPL"
            >
              <AlertCircle className="w-4 h-4 mr-2" /> Reset
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onDisconnect}
              className="h-8 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-900/10"
            >
              <Link2Off className="w-4 h-4 mr-2" /> Disconnect
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="connect"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <Button 
              size="sm" 
              onClick={onConnect}
              className="h-8 rounded-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            >
              <Link className="w-4 h-4 mr-2" /> Connect Device
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!('serial' in navigator) && (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-900/20 border border-red-900/50 rounded-full">
          <AlertCircle className="w-3 h-3 text-red-400" />
          <span className="text-[10px] text-red-400 font-medium uppercase">Web Serial Unsupported</span>
        </div>
      )}
    </div>
  );
};
