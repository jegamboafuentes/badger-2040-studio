
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { serialService } from '@/services/serialService';

export const Console: React.FC = () => {
  const [lines, setLines] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    serialService.setOutputListener((text) => {
      setLines(prev => {
        const newLines = [...prev, text];
        // Keep last 100 lines
        if (newLines.length > 100) return newLines.slice(-100);
        return newLines;
      });
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [lines]);

  const clearConsole = () => setLines([]);

  return (
    <Card className={`fixed bottom-6 right-6 w-80 md:w-96 bg-zinc-950 border-zinc-800 shadow-2xl transition-all duration-300 z-50 overflow-hidden flex flex-col ${isExpanded ? 'h-80' : 'h-12'}`}>
      <div 
        className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-500" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Device Console</span>
        </div>
        <div className="flex items-center gap-1">
          {isExpanded && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
              onClick={(e) => {
                e.stopPropagation();
                clearConsole();
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <ScrollArea ref={scrollRef} className="flex-1 p-4 font-mono text-[10px] leading-relaxed">
          {lines.length === 0 ? (
            <div className="text-zinc-700 italic">Waiting for device output...</div>
          ) : (
            <div className="whitespace-pre-wrap text-zinc-400">
              {lines.join('')}
            </div>
          )}
        </ScrollArea>
      )}
    </Card>
  );
};
