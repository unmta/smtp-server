export default class SmtpContext {
  private static instance: SmtpContext;
  private state: Map<string, any>;

  private constructor() {
    this.state = new Map();
  }

  // Method to get the singleton instance of SmtpContext
  public static getInstance(): SmtpContext {
    if (!SmtpContext.instance) {
      SmtpContext.instance = new SmtpContext();
    }
    return SmtpContext.instance;
  }

  // Method to set a persistent variable
  public set(key: string, value: any): void {
    this.state.set(key, value);
  }

  // Method to get a persistent variable
  public get(key: string): any {
    return this.state.get(key);
  }

  // Method to check if a key exists
  public has(key: string): boolean {
    return this.state.has(key);
  }
}
