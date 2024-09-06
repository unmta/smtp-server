export class naiveSmtpClient {
  private socket: any;
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
    await Bun.connect({
      hostname: this.host,
      port: this.port,
      socket: {
        data: (socket, data) => this.onData(socket, data),
        open: (socket) => this.onOpen(socket),
        close: (socket) => this.onClose(socket),
        drain: (socket) => this.onDrain(socket),
        error: (socket, error) => this.onError(socket, error),
        connectError: (socket, error) => this.onConnectError(socket, error),
        end: (socket) => this.onEnd(socket),
        timeout: (socket) => this.onTimeout(socket),
      },
    });
  }

  private async onData(socket: any, data: any) {
    this.buffer += data.toString();
    if (this.dataResolve) {
      this.dataResolve(this.buffer);
      this.buffer = ''; // Clear the buffer after resolving
      this.dataPromise = null;
      this.dataResolve = null;
    }
  }

  private async onOpen(socket: any) {
    this.socket = socket;
    console.log('Socket opened');
  }

  private async onClose(socket: any) {
    console.log('Socket closed');
  }

  private async onDrain(socket: any) {
    console.log('Socket ready for more data');
  }

  private async onError(socket: any, error: any) {
    console.error('Socket error:', error);
  }

  private onConnectError(socket: any, error: any) {
    console.error('Connection error:', error);
  }

  private onEnd(socket: any) {
    console.log('Connection ended by server');
  }

  private onTimeout(socket: any) {
    console.log('Connection timed out');
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
      await this.socket.write(data + newline);
    } else {
      console.error('Socket is not open');
    }
  }
}
