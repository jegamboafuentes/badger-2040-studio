
export class SerialService {
  private port: SerialPort | null = null;
  private writer: WritableStreamDefaultWriter | null = null;
  private reader: ReadableStreamDefaultReader | null = null;

  async connect(): Promise<boolean> {
    try {
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API not supported in this browser');
      }

      this.port = await (navigator as any).serial.requestPort();
      await this.port!.open({ baudRate: 115200 });
      
      this.writer = this.port!.writable!.getWriter();
      this.startReading();
      
      // Initial interrupt to ensure we can talk to the REPL
      const encoder = new TextEncoder();
      await this.writer.write(encoder.encode('\x03')); // Ctrl+C
      await new Promise(r => setTimeout(r, 200));
      await this.writer.write(encoder.encode('\x03')); // Double Ctrl+C for safety
      
      return true;
    } catch (error) {
      console.error('Serial connection error:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.reader) {
      await this.reader.cancel();
    }
    if (this.writer) {
      this.writer.releaseLock();
    }
    if (this.port) {
      await this.port.close();
    }
    this.port = null;
    this.writer = null;
    this.reader = null;
  }

  private onOutput: ((text: string) => void) | null = null;

  setOutputListener(callback: (text: string) => void) {
    this.onOutput = callback;
  }

  private async startReading() {
    if (!this.port?.readable) return;
    this.reader = this.port.readable.getReader();
    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        console.log('Badger Output:', text);
        if (this.onOutput) {
          this.onOutput(text);
        }
      }
    } catch (error) {
      console.error('Serial read error:', error);
    } finally {
      this.reader.releaseLock();
    }
  }

  async sendCode(code: string) {
    if (!this.writer) throw new Error('Not connected to device');

    const encoder = new TextEncoder();
    
    // 1. Interrupt any running code
    await this.writer.write(encoder.encode('\x03')); // Ctrl+C
    await new Promise(r => setTimeout(r, 100));
    await this.writer.write(encoder.encode('\x03')); // Double Ctrl+C
    await new Promise(r => setTimeout(r, 200));
    
    // 2. Enter Raw REPL mode
    await this.writer.write(encoder.encode('\x01')); // Ctrl+A
    await new Promise(r => setTimeout(r, 300));

    // 3. Send code in chunks
    const chunkSize = 64; // Smaller chunks for better reliability
    for (let i = 0; i < code.length; i += chunkSize) {
      const chunk = code.slice(i, i + chunkSize);
      await this.writer.write(encoder.encode(chunk));
      await new Promise(r => setTimeout(r, 20)); // Slightly longer delay
    }
    
    // 4. Execute code
    await this.writer.write(encoder.encode('\x04')); // Ctrl+D
    
    // 5. Wait for execution to finish or at least start
    await new Promise(r => setTimeout(r, 500));
    
    // 6. Exit raw REPL
    await this.writer.write(encoder.encode('\x02')); // Ctrl+B
  }

  async saveFile(filename: string, content: string) {
    if (!this.writer) throw new Error('Not connected to device');

    // We'll use a MicroPython script to write the file
    // We use triple quotes but need to escape any triple quotes in the content
    const escapedContent = content.replace(/'''/g, "\\'\\'\\'");
    const saveScript = `
import os
try:
    with open('${filename}', 'w') as f:
        f.write('''${escapedContent}''')
    print("SUCCESS: Saved ${filename}")
except Exception as e:
    print("ERROR: Failed to save ${filename}:", e)
`;
    await this.sendCode(saveScript);
  }

  isConnected(): boolean {
    return !!this.port;
  }

  async reset() {
    if (!this.writer) return;
    const encoder = new TextEncoder();
    // Send multiple Ctrl+C to break out of any loops
    await this.writer.write(encoder.encode('\x03'));
    await new Promise(r => setTimeout(r, 100));
    await this.writer.write(encoder.encode('\x03'));
    await new Promise(r => setTimeout(r, 100));
    await this.writer.write(encoder.encode('\x03'));
    // Send Ctrl+B to exit raw mode if in it
    await this.writer.write(encoder.encode('\x02'));
  }
}

export const serialService = new SerialService();
