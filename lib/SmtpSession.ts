import { EnvelopeAddress } from './EmailAddress';

type SmtpPhase = 'connection' | 'helo' | 'sender' | 'recipient' | 'data' | 'postdata';
export class SmtpSession {
  public id: number; // A unique identifier for the session
  public startTime: number; // The time the session started
  public phase: SmtpPhase; // The current phase of the SMTP session
  public isDataMode: boolean;
  public sender: EnvelopeAddress | null = null;
  public recipients: EnvelopeAddress[] = [];
  public pluginData: Record<string, Record<string, any>> = {};

  constructor(id: number, phase: 'connection' | 'helo' = 'connection', session: SmtpSession | null = null) {
    this.id = id;
    this.startTime = session?.startTime ? session.startTime : Date.now(); // Don't reset start time if we already have one
    this.phase = phase; // Connection for new connections, helo for RSET
    this.isDataMode = false;
  }
}

// A mostly read-only version of the SmtpSession class
// Plugins can store session data in their own namespace
export class SmtpPluginSession {
  private _id: number; // A unique identifier for the session
  private _startTime: number; // The time the session started
  private _phase: SmtpPhase; // The current phase of the SMTP session
  private _isDataMode: boolean;
  private _sender: EnvelopeAddress | null = null;
  private _recipients: EnvelopeAddress[] = [];
  private _pluginName: string;
  private _pluginData: Record<string, Record<string, any>> = {};

  constructor(pluginName: string, session: SmtpSession) {
    this._id = session.id;
    this._startTime = session.startTime;
    this._phase = session.phase;
    this._isDataMode = session.isDataMode;
    this._sender = session.sender;
    this._recipients = session.recipients;
    this._pluginName = pluginName;
    this._pluginData = session.pluginData;
  }

  public get id(): number {
    return this._id;
  }

  public get startTime(): number {
    return this._startTime;
  }

  public get phase(): SmtpPhase {
    return this._phase;
  }

  public get isDataMode(): boolean {
    return this._isDataMode;
  }

  public get sender(): EnvelopeAddress | null {
    return this._sender;
  }

  public get recipients(): EnvelopeAddress[] {
    return this._recipients;
  }

  // Method to read data set by other plugins
  public getPluginData(pluginName: string): Record<string, any> | undefined {
    return this._pluginData[pluginName];
  }

  // Method to read/write data for the specific plugin instance
  public getOwnPluginData(key: string): any {
    return this._pluginData[this._pluginName]?.[key];
  }

  public setOwnPluginData(key: string, value: any): void {
    if (!this._pluginData[this._pluginName]) {
      this._pluginData[this._pluginName] = {}; // Initialize the plugin's data store if not present
    }
    this._pluginData[this._pluginName][key] = value;
  }
}
