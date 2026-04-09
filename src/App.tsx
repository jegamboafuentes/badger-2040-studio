import { useState } from 'react';
import { DeviceManager } from './components/DeviceManager';
import { ExampleBrowser } from './components/ExampleBrowser';
import { LayoutEditor } from './components/LayoutEditor';
import { Console } from './components/Console';
import { serialService } from './services/serialService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Github, BookOpen, Layout, Info, ExternalLink, Cpu, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BadgerModel } from './services/githubService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [model, setModel] = useState<BadgerModel>('2040');
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleConnect = async () => {
    const success = await serialService.connect();
    if (success) {
      setIsConnected(true);
      toast.success('Connected to Badger 2040');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#000000', '#cccccc']
      });
    } else {
      toast.error('Failed to connect. Make sure your device is plugged in.');
    }
  };

  const handleDisconnect = async () => {
    await serialService.disconnect();
    setIsConnected(false);
    toast.info('Disconnected from device');
  };

  const handleReset = async () => {
    try {
      toast.loading('Resetting device REPL...', { id: 'reset' });
      // We'll just send Ctrl+C a few times via a dummy empty code push or a specific method
      // Let's add a reset method to SerialService
      await (serialService as any).reset(); 
      toast.success('Device reset successful', { id: 'reset' });
    } catch (error) {
      toast.error('Reset failed');
    }
  };

  const handlePushCode = async (code: string) => {
    try {
      toast.loading('Pushing code to device...', { id: 'push' });
      await serialService.sendCode(code);
      toast.success('Code executed successfully!', { id: 'push' });
    } catch (error) {
      toast.error('Failed to push code: ' + (error as Error).message, { id: 'push' });
    }
  };

  const handleSaveFile = async (filename: string, code: string) => {
    try {
      toast.loading(`Saving ${filename} to device...`, { id: 'save' });
      await serialService.saveFile(filename, code);
      toast.success(`${filename} saved successfully!`, { id: 'save' });
    } catch (error) {
      toast.error('Failed to save file: ' + (error as Error).message, { id: 'save' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800">
      <Toaster position="bottom-right" theme="dark" />
      
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-lg overflow-hidden flex items-center justify-center border border-zinc-700">
              {/* User: Replace src with your uploaded badger-icon.png */}
              <img 
                src="https://github.com/pimoroni/badger2040/blob/main/badger_os/badges/badge.jpg?raw=true" 
                alt="Badger Icon" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Badger 2040 <span className="text-zinc-500 font-normal">Studio</span></h1>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-tight leading-none">
                Create your own badge design from your browser
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              <button 
                onClick={() => setModel('2040')}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${model === '2040' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Badger 2040
              </button>
              <button 
                onClick={() => setModel('2040W')}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${model === '2040W' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Badger 2040W
              </button>
            </div>

            <DeviceManager 
              isConnected={isConnected} 
              onConnect={handleConnect} 
              onDisconnect={handleDisconnect} 
              onReset={handleReset}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="editor" className="space-y-8">
          <div className="flex items-center justify-between">
            <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
              <TabsTrigger value="editor" className="text-zinc-400 data-[state=active]:text-zinc-100 data-[state=active]:bg-zinc-800 gap-2">
                <Layout className="w-4 h-4" /> Visual Editor
              </TabsTrigger>
              <TabsTrigger value="guide" className="text-zinc-400 data-[state=active]:text-zinc-100 data-[state=active]:bg-zinc-800 gap-2">
                <Info className="w-4 h-4" /> Setup Guide
              </TabsTrigger>
              <TabsTrigger value="examples" className="text-zinc-400 data-[state=active]:text-zinc-100 data-[state=active]:bg-zinc-800 gap-2">
                <BookOpen className="w-4 h-4" /> Examples
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-6">
              <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
                <DialogTrigger asChild>
                  <button className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest font-bold">
                    About
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">About Badger 2040 Studio</DialogTitle>
                    <DialogDescription className="text-zinc-400 pt-4 leading-relaxed">
                      This is an open-source project developed by <span className="text-zinc-100 font-medium">Enrique Gamboa</span> as part of his Metaverse Professional portfolio.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end pt-4">
                    <Button variant="outline" onClick={() => setIsAboutOpen(false)} className="border-zinc-800 hover:bg-zinc-900">
                      Close
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <a 
                href="https://github.com/pimoroni/badger2040" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <Github className="w-4 h-4" /> pimoroni/badger2040
              </a>
            </div>
          </div>

          <TabsContent value="editor">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <LayoutEditor isConnected={isConnected} onPush={handlePushCode} />
            </motion.div>
          </TabsContent>

          <TabsContent value="guide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto space-y-12 py-8"
            >
              <section className="space-y-4">
                <h2 className="text-2xl font-bold">Connecting your Badger 2040</h2>
                <p className="text-zinc-400 leading-relaxed">
                  This studio uses the <span className="text-zinc-200 font-medium">Web Serial API</span> to communicate directly with your device from the browser. 
                  No extra software or drivers are usually required on modern browsers (Chrome, Edge, Opera).
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 font-bold">1</div>
                  <h3 className="font-bold">Prepare Device</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Ensure your Badger 2040 is running <span className="text-zinc-300">MicroPython</span>. 
                    If you just bought it, it likely already has it installed.
                  </p>
                </div>

                <div className="space-y-4 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 font-bold">2</div>
                  <h3 className="font-bold">Plug & Connect</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Connect the device via USB-C. Click the "Connect Device" button above and select 
                    the port labeled <span className="text-zinc-300">CircuitPython CDC</span> or <span className="text-zinc-300">RP2040</span>.
                  </p>
                  <div className="mt-4 p-3 bg-amber-900/20 border border-amber-900/50 rounded-lg">
                    <p className="text-[10px] text-amber-500 font-bold uppercase mb-1">⚠️ Important</p>
                    <p className="text-[10px] text-amber-200/70 leading-tight">
                      Close Thonny or any other serial software before connecting. Only one app can talk to the device at a time.
                    </p>
                  </div>
                </div>
              </div>

              <section className="space-y-4 pt-8 border-t border-zinc-800">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" /> Useful Links
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a href="https://shop.pimoroni.com/products/badger-2040" target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline">
                      Buy Badger 2040 at Pimoroni
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/pimoroni/badger2040/tree/main/examples" target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline">
                      Official GitHub Examples
                    </a>
                  </li>
                  <li>
                    <a href="https://learn.pimoroni.com/article/getting-started-with-badger-2040" target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline">
                      Getting Started Guide
                    </a>
                  </li>
                </ul>
              </section>
            </motion.div>
          </TabsContent>

          <TabsContent value="examples">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ExampleBrowser 
                isConnected={isConnected} 
                onExecute={handlePushCode} 
                onSave={handleSaveFile}
                model={model} 
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 opacity-50">
              <div className="w-6 h-6 bg-zinc-800 rounded-sm" />
              <span className="text-xs font-mono uppercase tracking-widest">Badger 2040 Studio</span>
            </div>
            <p className="text-xs text-zinc-500 max-w-md">
              This is an open-source project developed by <span className="text-zinc-300 font-medium">Enrique Gamboa</span> as part of his Metaverse Professional portfolio.
            </p>
          </div>
          
          <div className="flex flex-col md:items-end gap-3">
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/jegamboafuentes" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-2 transition-colors"
              >
                <Github className="w-3 h-3" /> Developed by: Enrique Gamboa
              </a>
              <a 
                href="https://github.com/jegamboafuentes/badger-2040-studio" 
                className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-2 transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> Project Repo
              </a>
            </div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-tighter">
              Enrique Gamboa - Open Source Developer
            </p>
          </div>
        </div>
      </footer>

      <Console />
    </div>
  );
}
