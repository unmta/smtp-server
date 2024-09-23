import { Socket, createConnection } from 'net';

export class naiveSmtpClient {
  private socket: Socket | null = null;
  private port: number;
  private host: string;
  private buffer: string = '';
  private dataPromise: Promise<string> | null = null;
  private dataResolve: ((value: string) => void) | null = null;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
  }

  public async connect() {
    this.socket = createConnection({ host: this.host, port: this.port }, () => {});
    this.socket?.on('connect', () => console.log('Connected to server'));
    this.socket?.on('data', (data: any) => this.onData(data));
  }

  private async onData(data: any) {
    this.buffer += data.toString();
    if (this.dataResolve) {
      this.dataResolve(this.buffer);
      this.buffer = ''; // Clear the buffer after resolving
      this.dataPromise = null;
      this.dataResolve = null;
    }
  }

  public async receive(): Promise<string> {
    if (this.buffer) {
      const data = this.buffer;
      this.buffer = ''; // Clear the buffer after reading
      return data;
    }

    if (!this.dataPromise) {
      this.dataPromise = new Promise((resolve) => {
        this.dataResolve = resolve;
      });
    }

    return this.dataPromise;
  }

  public async send(data: string, newline = '\r\n') {
    if (this.socket) {
      this.socket.write(data + newline);
    } else {
      console.error('Socket is not open');
    }
  }
}
