
export interface GitHubFile {
  name: string;
  path: string;
  download_url: string;
  type: string;
}

export type BadgerModel = '2040' | '2040W';

const FALLBACK_EXAMPLES_2040: GitHubFile[] = [
  { name: "badge.py", path: "badger_os/examples/badge.py", download_url: "https://raw.githubusercontent.com/pimoroni/badger2040/main/badger_os/examples/badge.py", type: "file" },
  { name: "clock.py", path: "badger_os/examples/clock.py", download_url: "https://raw.githubusercontent.com/pimoroni/badger2040/main/badger_os/examples/clock.py", type: "file" },
  { name: "ebook.py", path: "badger_os/examples/ebook.py", download_url: "https://raw.githubusercontent.com/pimoroni/badger2040/main/badger_os/examples/ebook.py", type: "file" },
  { name: "fonts.py", path: "badger_os/examples/fonts.py", download_url: "https://raw.githubusercontent.com/pimoroni/badger2040/main/badger_os/examples/fonts.py", type: "file" },
  { name: "image.py", path: "badger_os/examples/image.py", download_url: "https://raw.githubusercontent.com/pimoroni/badger2040/main/badger_os/examples/image.py", type: "file" },
  { name: "list.py", path: "badger_os/examples/list.py", download_url: "https://raw.githubusercontent.com/pimoroni/badger2040/main/badger_os/examples/list.py", type: "file" },
  { name: "qrgen.py", path: "badger_os/examples/qrgen.py", download_url: "https://raw.githubusercontent.com/pimoroni/badger2040/main/badger_os/examples/qrgen.py", type: "file" }
];

const FALLBACK_EXAMPLES_2040W: GitHubFile[] = [
  { name: "weather.py", path: "badger_os_w/examples/weather.py", download_url: "https://raw.githubusercontent.com/pimoroni/badger2040/main/badger_os_w/examples/weather.py", type: "file" },
  { name: "news.py", path: "badger_os_w/examples/news.py", download_url: "https://raw.githubusercontent.com/pimoroni/badger2040/main/badger_os_w/examples/news.py", type: "file" },
  { name: "clock.py", path: "badger_os_w/examples/clock.py", download_url: "https://raw.githubusercontent.com/pimoroni/badger2040/main/badger_os_w/examples/clock.py", type: "file" }
];

export async function fetchExamples(model: BadgerModel): Promise<GitHubFile[]> {
  const path = model === '2040W' ? 'badger_os_w/examples' : 'badger_os/examples';
  const fallbacks = model === '2040W' ? FALLBACK_EXAMPLES_2040W : FALLBACK_EXAMPLES_2040;
  
  try {
    const response = await fetch(`https://api.github.com/repos/pimoroni/badger2040/contents/${path}`);
    if (!response.ok) {
      console.warn(`GitHub API error (${response.status}). Using fallback for ${model}.`);
      return fallbacks;
    }
    
    const data = await response.json();
    return data.filter((file: any) => file.type === 'file' && file.name.endsWith('.py'));
  } catch (error) {
    console.error(`Error fetching examples for ${model}, using fallback:`, error);
    return fallbacks;
  }
}

export async function fetchFileContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch file content');
    return await response.text();
  } catch (error) {
    console.error('Error fetching file content:', error);
    return '';
  }
}
