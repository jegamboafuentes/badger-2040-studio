
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Type, Minus, Trash2, Send, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface TextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  content: string;
  size: number;
}

interface LineElement {
  id: string;
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

type Element = TextElement | LineElement;

interface LayoutEditorProps {
  onPush: (code: string) => void;
  isConnected: boolean;
}

export const LayoutEditor: React.FC<LayoutEditorProps> = ({ onPush, isConnected }) => {
  const [elements, setElements] = useState<Element[]>(() => {
    const saved = localStorage.getItem('badger_layout');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('badger_layout', JSON.stringify(elements));
  }, [elements]);

  const addText = () => {
    const newText: TextElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      x: 10,
      y: 20,
      content: 'New Text',
      size: 2,
    };
    setElements([...elements, newText]);
    setSelectedId(newText.id);
  };

  const addLine = () => {
    const newLine: LineElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'line',
      x1: 10,
      y1: 10,
      x2: 50,
      y2: 10,
    };
    setElements([...elements, newLine]);
    setSelectedId(newLine.id);
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear the entire layout?')) {
      setElements([]);
      setSelectedId(null);
    }
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateElement = (id: string, updates: Partial<Element>) => {
    setElements(elements.map(e => (e.id === id ? { ...e, ...updates } as any : e)));
  };

  const generateMicroPython = () => {
    let code = `
import badger2040
display = badger2040.Badger2040()
display.set_update_speed(badger2040.UPDATE_NORMAL)
display.set_thickness(2)
display.set_pen(15) # White
display.clear()
display.set_pen(0) # Black
`;

    elements.forEach(el => {
      if (el.type === 'text') {
        // Escape double quotes in content
        const safeContent = el.content.replace(/"/g, '\\"');
        code += `display.text("${safeContent}", ${Math.round(el.x)}, ${Math.round(el.y)}, scale=${el.size})\n`;
      } else if (el.type === 'line') {
        code += `display.line(${Math.round(el.x1)}, ${Math.round(el.y1)}, ${Math.round(el.x2)}, ${Math.round(el.y2)})\n`;
      }
    });

    code += `display.update()\n`;
    return code;
  };

  const selectedElement = elements.find(e => e.id === selectedId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-4 bg-zinc-950 border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Screen Preview (296x128)</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={clearAll} className="h-8 border-zinc-700 text-zinc-500 hover:text-red-400">
                Clear All
              </Button>
              <Button size="sm" variant="outline" onClick={addText} className="h-8 border-zinc-700 hover:bg-zinc-800">
                <Type className="w-4 h-4 mr-2" /> Text
              </Button>
              <Button size="sm" variant="outline" onClick={addLine} className="h-8 border-zinc-700 hover:bg-zinc-800">
                <Minus className="w-4 h-4 mr-2" /> Line
              </Button>
            </div>
          </div>
          
          <div 
            ref={canvasRef}
            className="relative bg-white border-4 border-zinc-800 mx-auto overflow-hidden shadow-2xl cursor-crosshair"
            style={{ width: '296px', height: '128px', transform: 'scale(1.5)', transformOrigin: 'center', margin: '40px auto' }}
            onClick={(e) => {
              if (e.target === canvasRef.current) setSelectedId(null);
            }}
          >
            {elements.map(el => (
              <div
                key={el.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(el.id);
                }}
                className={`absolute cursor-move select-none transition-all ${selectedId === el.id ? 'ring-2 ring-blue-500 ring-offset-2 z-10' : 'hover:ring-1 hover:ring-zinc-300'}`}
                style={{
                  left: el.type === 'text' ? `${el.x}px` : '0',
                  top: el.type === 'text' ? `${el.y}px` : '0',
                }}
              >
                {el.type === 'text' ? (
                  <span style={{ fontSize: `${el.size * 8}px`, fontFamily: 'monospace', color: 'black', whiteSpace: 'nowrap' }}>
                    {el.content}
                  </span>
                ) : (
                  <svg width="296" height="128" className="absolute top-0 left-0">
                    {/* Invisible wider stroke for easier clicking */}
                    <line 
                      x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} 
                      stroke="transparent" strokeWidth="15" 
                      className="cursor-pointer pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(el.id);
                      }}
                    />
                    <line 
                      x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} 
                      stroke={selectedId === el.id ? '#3b82f6' : 'black'} 
                      strokeWidth={selectedId === el.id ? '4' : '2'} 
                      className="pointer-events-none"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button 
            onClick={() => onPush(generateMicroPython())} 
            disabled={!isConnected}
            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
          >
            <Send className="w-4 h-4 mr-2" /> Push to Badger
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-zinc-900 border-zinc-800 flex flex-col gap-6 overflow-hidden">
        <div>
          <h3 className="text-sm font-mono text-zinc-400 mb-4 uppercase tracking-wider">Elements</h3>
          <ScrollArea className="h-48 border border-zinc-800 rounded-md bg-zinc-950/50">
            <div className="p-2 space-y-1">
              {elements.length === 0 ? (
                <div className="text-[10px] text-zinc-700 text-center py-8 italic">No elements added</div>
              ) : (
                elements.map((el) => (
                  <button
                    key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-[10px] font-mono transition-colors ${
                      selectedId === el.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {el.type === 'text' ? <Type className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      <span className="truncate">{el.type === 'text' ? el.content : `Line (${el.x1},${el.y1})`}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-5 w-5 text-zinc-600 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeElement(el.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-sm font-mono text-zinc-400 mb-4 uppercase tracking-wider">Properties</h3>
          {selectedElement ? (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[9px] uppercase bg-zinc-800 text-zinc-400 border-none">
                    {selectedElement.type} Settings
                  </Badge>
                </div>

                {selectedElement.type === 'text' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Content</label>
                      <Input 
                        value={selectedElement.content} 
                        onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">X Position</label>
                        <Input 
                          type="number"
                          value={selectedElement.x} 
                          onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                          className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Y Position</label>
                        <Input 
                          type="number"
                          value={selectedElement.y} 
                          onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                          className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Scale</label>
                        <span className="text-xs text-zinc-500">{selectedElement.size}</span>
                      </div>
                      <Slider 
                        value={[selectedElement.size]} 
                        min={1} max={10} step={1}
                        onValueChange={(val) => updateElement(selectedElement.id, { size: val[0] })}
                      />
                    </div>
                  </>
                )}

                {selectedElement.type === 'line' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">X1 Start</label>
                      <Input type="number" value={selectedElement.x1} onChange={(e) => updateElement(selectedElement.id, { x1: parseInt(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Y1 Start</label>
                      <Input type="number" value={selectedElement.y1} onChange={(e) => updateElement(selectedElement.id, { y1: parseInt(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">X2 End</label>
                      <Input type="number" value={selectedElement.x2} onChange={(e) => updateElement(selectedElement.id, { x2: parseInt(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Y2 End</label>
                      <Input type="number" value={selectedElement.y2} onChange={(e) => updateElement(selectedElement.id, { y2: parseInt(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-600 border-2 border-dashed border-zinc-800 rounded-lg">
              <Plus className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-[10px] uppercase tracking-widest">Select an element</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
