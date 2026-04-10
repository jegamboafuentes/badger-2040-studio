
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Type, Minus, Trash2, Send, Plus, Square, Circle as CircleIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface TextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  content: string;
  size: number;
  font: string;
}

interface LineElement {
  id: string;
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface RectElement {
  id: string;
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  filled: boolean;
}

interface CircleElement {
  id: string;
  type: 'circle';
  x: number;
  y: number;
  r: number;
  filled: boolean;
}

type Element = TextElement | LineElement | RectElement | CircleElement;

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
  const [dragging, setDragging] = useState<{ id: string, part: string, startX: number, startY: number, initialEl: any } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('badger_layout', JSON.stringify(elements));
  }, [elements]);

  const handlePointerDown = (e: React.PointerEvent, id: string, part: string) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(id);
    const el = elements.find(e => e.id === id);
    if (el) {
      setDragging({
        id,
        part,
        startX: e.clientX,
        startY: e.clientY,
        initialEl: { ...el }
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    
    // Calculate delta in canvas coordinates (canvas is scaled by 1.5)
    const dx = (e.clientX - dragging.startX) / 1.5;
    const dy = (e.clientY - dragging.startY) / 1.5;

    setElements(elements.map(el => {
      if (el.id !== dragging.id) return el;
      
      const init = dragging.initialEl;
      if (el.type === 'text' || el.type === 'rect' || el.type === 'circle') {
        return { ...el, x: Math.round(init.x + dx), y: Math.round(init.y + dy) };
      } else if (el.type === 'line') {
        if (dragging.part === 'start') {
          return { ...el, x1: Math.round(init.x1 + dx), y1: Math.round(init.y1 + dy) };
        } else if (dragging.part === 'end') {
          return { ...el, x2: Math.round(init.x2 + dx), y2: Math.round(init.y2 + dy) };
        } else if (dragging.part === 'body') {
          return { 
            ...el, 
            x1: Math.round(init.x1 + dx), 
            y1: Math.round(init.y1 + dy),
            x2: Math.round(init.x2 + dx), 
            y2: Math.round(init.y2 + dy)
          };
        }
      }
      return el;
    }));
  };

  const handlePointerUp = () => {
    setDragging(null);
  };

  const addText = () => {
    const newText: TextElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      x: 10,
      y: 20,
      content: 'New Text',
      size: 2,
      font: 'sans',
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

  const addRect = () => {
    const newRect: RectElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'rect',
      x: 50,
      y: 50,
      w: 40,
      h: 30,
      filled: true,
    };
    setElements([...elements, newRect]);
    setSelectedId(newRect.id);
  };

  const addCircle = () => {
    const newCircle: CircleElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'circle',
      x: 100,
      y: 64,
      r: 20,
      filled: true,
    };
    setElements([...elements, newCircle]);
    setSelectedId(newCircle.id);
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
        const safeContent = el.content.replace(/"/g, '\\"');
        code += `try:\n    display.set_font("${el.font || 'sans'}")\nexcept:\n    pass\n`;
        // The Badger2040 display.text() method takes (text, x, y, wordwrap, scale)
        // If we only pass 4 arguments, it might interpret the 4th as wordwrap instead of scale if not named.
        // Let's pass the wordwrap parameter explicitly (e.g., 296 for full width) and then the scale.
        code += `display.text("${safeContent}", ${Math.round(el.x)}, ${Math.round(el.y)}, 296, ${el.size})\n`;
      } else if (el.type === 'line') {
        code += `display.line(${Math.round(el.x1)}, ${Math.round(el.y1)}, ${Math.round(el.x2)}, ${Math.round(el.y2)})\n`;
      } else if (el.type === 'rect') {
        if (!el.filled) {
          code += `display.line(${Math.round(el.x)}, ${Math.round(el.y)}, ${Math.round(el.x + el.w)}, ${Math.round(el.y)})\n`;
          code += `display.line(${Math.round(el.x + el.w)}, ${Math.round(el.y)}, ${Math.round(el.x + el.w)}, ${Math.round(el.y + el.h)})\n`;
          code += `display.line(${Math.round(el.x + el.w)}, ${Math.round(el.y + el.h)}, ${Math.round(el.x)}, ${Math.round(el.y + el.h)})\n`;
          code += `display.line(${Math.round(el.x)}, ${Math.round(el.y + el.h)}, ${Math.round(el.x)}, ${Math.round(el.y)})\n`;
        } else {
          code += `try:\n    display.rectangle(${Math.round(el.x)}, ${Math.round(el.y)}, ${Math.round(el.w)}, ${Math.round(el.h)})\nexcept:\n    pass\n`;
        }
      } else if (el.type === 'circle') {
        if (!el.filled) {
           code += `try:\n    display.set_pen(0)\n    display.circle(${Math.round(el.x)}, ${Math.round(el.y)}, ${Math.round(el.r)})\n    display.set_pen(15)\n    display.circle(${Math.round(el.x)}, ${Math.round(el.y)}, ${Math.round(el.r - 2)})\n    display.set_pen(0)\nexcept:\n    pass\n`;
        } else {
           code += `try:\n    display.circle(${Math.round(el.x)}, ${Math.round(el.y)}, ${Math.round(el.r)})\nexcept:\n    pass\n`;
        }
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
            <div className="flex gap-2 flex-wrap justify-end">
              <Button size="sm" variant="outline" onClick={clearAll} className="h-8 border-zinc-700 text-zinc-500 hover:text-red-400">
                Clear All
              </Button>
              <Button size="sm" variant="outline" onClick={addText} className="h-8 border-zinc-700 hover:bg-zinc-800">
                <Type className="w-4 h-4 mr-2" /> Text
              </Button>
              <Button size="sm" variant="outline" onClick={addLine} className="h-8 border-zinc-700 hover:bg-zinc-800">
                <Minus className="w-4 h-4 mr-2" /> Line
              </Button>
              <Button size="sm" variant="outline" onClick={addRect} className="h-8 border-zinc-700 hover:bg-zinc-800">
                <Square className="w-4 h-4 mr-2" /> Rect
              </Button>
              <Button size="sm" variant="outline" onClick={addCircle} className="h-8 border-zinc-700 hover:bg-zinc-800">
                <CircleIcon className="w-4 h-4 mr-2" /> Circle
              </Button>
            </div>
          </div>
          
          <div 
            ref={canvasRef}
            className="relative bg-white border-4 border-zinc-800 mx-auto overflow-hidden shadow-2xl"
            style={{ width: '296px', height: '128px', transform: 'scale(1.5)', transformOrigin: 'center', margin: '40px auto', touchAction: 'none' }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={(e) => {
              if (e.target === canvasRef.current) setSelectedId(null);
            }}
          >
            {elements.map(el => {
              const isSelected = selectedId === el.id;
              
              if (el.type === 'text') {
                // Badger 2040 text scaling depends heavily on the font.
                // Looking at the device photo vs the UI:
                // - Bitmap 14 Outline (scale 1) is quite small on device.
                // - Serif (scale 1) is larger than Bitmap 14.
                // - Bitmap 8 (scale 1) is very small.
                // - Scale 2 and 3 multiply the base size linearly.
                
                let baseFontSize = 12; // Default for sans
                
                switch (el.font) {
                  case 'serif':
                    baseFontSize = 16; // Serif renders larger on device
                    break;
                  case 'bitmap8':
                    baseFontSize = 8; // Bitmap 8 is exactly 8 pixels tall at scale 1
                    break;
                  case 'bitmap14_outline':
                    baseFontSize = 14; // Bitmap 14 is 14 pixels tall
                    break;
                  case 'gothic':
                    baseFontSize = 18; // Gothic is quite large
                    break;
                  case 'cursive':
                    baseFontSize = 16;
                    break;
                }
                
                const fontSize = el.size * baseFontSize;
                
                const getFontFamily = (font: string) => {
                  switch (font) {
                    case 'serif': return "'Merriweather', serif";
                    case 'bitmap8': return "'VT323', monospace";
                    case 'bitmap14_outline': return "'VT323', monospace";
                    case 'gothic': return "'UnifrakturMaguntia', cursive";
                    case 'cursive': return "'Dancing Script', cursive";
                    case 'sans':
                    default: return "sans-serif";
                  }
                };

                const isOutline = el.font === 'bitmap14_outline';
                
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handlePointerDown(e, el.id, 'body')}
                    className={`absolute cursor-move select-none transition-none ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 z-10' : 'hover:ring-1 hover:ring-zinc-300'}`}
                    style={{
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      fontSize: `${fontSize}px`, 
                      fontFamily: getFontFamily(el.font),
                      color: isOutline ? 'transparent' : 'black', 
                      WebkitTextStroke: isOutline ? '1px black' : 'none',
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                      transformOrigin: 'top left',
                      // The text on the device is drawn from the top-left coordinate, but standard HTML text
                      // has some baseline padding. We adjust slightly to match the device better.
                      marginTop: '-2px'
                    }}
                  >
                    {el.content}
                  </div>
                );
              } else if (el.type === 'rect') {
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handlePointerDown(e, el.id, 'body')}
                    className={`absolute cursor-move select-none transition-none ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 z-10' : 'hover:ring-1 hover:ring-zinc-300'}`}
                    style={{
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.w}px`,
                      height: `${el.h}px`,
                      backgroundColor: el.filled ? 'black' : 'transparent',
                      border: el.filled ? 'none' : '2px solid black'
                    }}
                  />
                );
              } else if (el.type === 'circle') {
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handlePointerDown(e, el.id, 'body')}
                    className={`absolute cursor-move select-none transition-none ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 z-10' : 'hover:ring-1 hover:ring-zinc-300'}`}
                    style={{
                      left: `${el.x - el.r}px`,
                      top: `${el.y - el.r}px`,
                      width: `${el.r * 2}px`,
                      height: `${el.r * 2}px`,
                      borderRadius: '50%',
                      backgroundColor: el.filled ? 'black' : 'transparent',
                      border: el.filled ? 'none' : '2px solid black'
                    }}
                  />
                );
              } else if (el.type === 'line') {
                return (
                  <svg key={el.id} width="296" height="128" className="absolute top-0 left-0 pointer-events-none">
                    <line 
                      x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} 
                      stroke="transparent" strokeWidth="15" 
                      className="cursor-move pointer-events-auto"
                      onPointerDown={(e) => handlePointerDown(e, el.id, 'body')}
                    />
                    <line 
                      x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} 
                      stroke={isSelected ? '#3b82f6' : 'black'} 
                      strokeWidth={isSelected ? '4' : '2'} 
                    />
                    {isSelected && (
                      <>
                        <circle cx={el.x1} cy={el.y1} r="5" fill="#3b82f6" className="cursor-pointer pointer-events-auto" onPointerDown={(e) => handlePointerDown(e, el.id, 'start')} />
                        <circle cx={el.x2} cy={el.y2} r="5" fill="#3b82f6" className="cursor-pointer pointer-events-auto" onPointerDown={(e) => handlePointerDown(e, el.id, 'end')} />
                      </>
                    )}
                  </svg>
                );
              }
            })}
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
                      {el.type === 'text' && <Type className="w-3 h-3" />}
                      {el.type === 'line' && <Minus className="w-3 h-3" />}
                      {el.type === 'rect' && <Square className="w-3 h-3" />}
                      {el.type === 'circle' && <CircleIcon className="w-3 h-3" />}
                      <span className="truncate">
                        {el.type === 'text' ? el.content : 
                         el.type === 'line' ? `Line (${el.x1},${el.y1})` : 
                         el.type === 'rect' ? `Rect (${el.w}x${el.h})` : 
                         `Circle (r=${el.r})`}
                      </span>
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
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Font</label>
                      <select 
                        value={selectedElement.font || 'sans'} 
                        onChange={(e) => updateElement(selectedElement.id, { font: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 h-8 text-xs text-white rounded-md px-2 outline-none focus:ring-2 focus:ring-zinc-600"
                      >
                        <option value="sans">Sans</option>
                        <option value="serif">Serif</option>
                        <option value="bitmap8">Bitmap 8</option>
                        <option value="bitmap14_outline">Bitmap 14 Outline</option>
                        <option value="gothic">Gothic</option>
                        <option value="cursive">Cursive</option>
                      </select>
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
                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Scale</label>
                        <Input 
                          type="number"
                          min="1"
                          max="10"
                          value={selectedElement.size} 
                          onChange={(e) => updateElement(selectedElement.id, { size: parseInt(e.target.value) || 1 })}
                          className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white"
                        />
                      </div>
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

                {selectedElement.type === 'rect' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Style</label>
                      <select 
                        value={selectedElement.filled ? 'filled' : 'hollow'} 
                        onChange={(e) => updateElement(selectedElement.id, { filled: e.target.value === 'filled' })}
                        className="w-full bg-zinc-800 border border-zinc-700 h-8 text-xs text-white rounded-md px-2 outline-none focus:ring-2 focus:ring-zinc-600"
                      >
                        <option value="filled">Filled (Solid Black)</option>
                        <option value="hollow">Hollow (Outline)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">X Position</label>
                        <Input type="number" value={selectedElement.x} onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Y Position</label>
                        <Input type="number" value={selectedElement.y} onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Width</label>
                        <Input type="number" value={selectedElement.w} onChange={(e) => updateElement(selectedElement.id, { w: parseInt(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Height</label>
                        <Input type="number" value={selectedElement.h} onChange={(e) => updateElement(selectedElement.id, { h: parseInt(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white" />
                      </div>
                    </div>
                  </>
                )}

                {selectedElement.type === 'circle' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Style</label>
                      <select 
                        value={selectedElement.filled ? 'filled' : 'hollow'} 
                        onChange={(e) => updateElement(selectedElement.id, { filled: e.target.value === 'filled' })}
                        className="w-full bg-zinc-800 border border-zinc-700 h-8 text-xs text-white rounded-md px-2 outline-none focus:ring-2 focus:ring-zinc-600"
                      >
                        <option value="filled">Filled (Solid Black)</option>
                        <option value="hollow">Hollow (Outline)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Center X</label>
                        <Input type="number" value={selectedElement.x} onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Center Y</label>
                        <Input type="number" value={selectedElement.y} onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white" />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-tight">Radius</label>
                        <Input type="number" value={selectedElement.r} onChange={(e) => updateElement(selectedElement.id, { r: parseInt(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700 h-8 text-xs text-white" />
                      </div>
                    </div>
                  </>
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
