
import React, { useEffect, useState } from 'react';
import { fetchExamples, fetchFileContent, GitHubFile, BadgerModel } from '@/services/githubService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileCode, Play, ExternalLink, Loader2, Edit3, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';

interface ExampleBrowserProps {
  onExecute: (code: string) => void;
  onSave: (filename: string, code: string) => void;
  isConnected: boolean;
  model: BadgerModel;
}

export const ExampleBrowser: React.FC<ExampleBrowserProps> = ({ onExecute, onSave, isConnected, model }) => {
  const [examples, setExamples] = useState<GitHubFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExample, setSelectedExample] = useState<GitHubFile | null>(null);
  const [content, setContent] = useState<string>('');
  const [fetchingContent, setFetchingContent] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExamples(model);
      setExamples(data);
      // Check if we are using fallbacks
      const isFallback = data.length > 0 && (data[0].download_url.includes('raw.githubusercontent.com') && !data[0].path.startsWith('badger_os'));
      // Actually our fetchExamples returns fallbacks if response is not ok.
      // We can check if it's one of our fallback lists.
      setUsingFallback(false); // Reset for now, fetchExamples handles it
    } catch (err) {
      setError('Failed to load examples. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [model]);

  const handleSelect = async (example: GitHubFile) => {
    setSelectedExample(example);
    setFetchingContent(true);
    try {
      const text = await fetchFileContent(example.download_url);
      setContent(text);
    } catch (err) {
      toast.error('Failed to load file content');
    } finally {
      setFetchingContent(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[650px]">
      <Card className="md:col-span-1 bg-zinc-900 border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider">GitHub Examples</h3>
            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-tighter">Model: {model}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={load} disabled={loading} className="h-6 w-6 text-zinc-500">
            <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              <span className="text-[10px] text-zinc-600 uppercase">Fetching...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-32 p-4 text-center">
              <p className="text-xs text-zinc-500 mb-2">{error}</p>
              <Button size="sm" variant="outline" onClick={load} className="h-7 text-[10px] uppercase">Retry</Button>
            </div>
          ) : (
            <div className="space-y-1">
              {examples.map(ex => (
                <button
                  key={ex.path}
                  onClick={() => handleSelect(ex)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedExample?.path === ex.path 
                      ? 'bg-zinc-800 text-zinc-100' 
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center">
                    <FileCode className="w-4 h-4 mr-2 opacity-70" />
                    <span className="truncate">{ex.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      <Card className="md:col-span-2 bg-zinc-950 border-zinc-800 flex flex-col overflow-hidden">
        {selectedExample ? (
          <>
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <h3 className="text-sm font-medium text-zinc-200">{selectedExample.name}</h3>
                  <span className="text-[9px] text-zinc-500 font-mono">Editable Code</span>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase border-zinc-700 text-zinc-500">MicroPython</Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 border-zinc-700 text-zinc-400 hover:text-zinc-200"
                  onClick={() => window.open(`https://github.com/pimoroni/badger2040/blob/main/${selectedExample.path}`, '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-2" /> GitHub
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  disabled={!isConnected || fetchingContent}
                  onClick={() => onSave(selectedExample.name, content)}
                  className="h-8 border-zinc-700 text-zinc-400 hover:text-zinc-200"
                >
                  <Save className="w-3 h-3 mr-2" /> Save to Device
                </Button>
                <Button 
                  size="sm" 
                  disabled={!isConnected || fetchingContent}
                  onClick={() => onExecute(content)}
                  className="h-8 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-bold"
                >
                  <Play className="w-3 h-3 mr-2" /> Run on Device
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 bg-zinc-950">
              {fetchingContent ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
                </div>
              ) : (
                <div className="p-4 font-mono text-xs">
                  <Editor
                    value={content}
                    onValueChange={code => setContent(code)}
                    highlight={code => highlight(code, languages.python, 'python')}
                    padding={20}
                    className="min-h-full focus:outline-none"
                    style={{
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      fontSize: 12,
                      backgroundColor: 'transparent',
                      color: '#e4e4e7', // zinc-200
                    }}
                  />
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <FileCode className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-sm">Select an example to view and edit code</p>
          </div>
        )}
      </Card>
    </div>
  );
};
