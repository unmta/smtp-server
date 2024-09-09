import { EnvelopeAddress } from './EmailAddress';

export default class SmtpSession {
  // The current phase of the SMTP session
  public id: number; // A unique identifier for the session
  public startTime: number; // The time the session started
  public phase: 'connection' | 'helo' | 'sender' | 'recipient' | 'data' | 'postdata';
  public isDataMode: boolean;
  // public messageReadStream: ReadableStream | null = null;
  public sender: EnvelopeAddress | null = null;
  public recipients: EnvelopeAddress[] = [];

  constructor(id: number, phase: 'connection' | 'helo' = 'connection', session: SmtpSession | null = null) {
    this.id = id;
    this.startTime = session?.startTime ? session.startTime : Date.now(); // Don't reset start time if we already have one
    this.phase = phase; // Connection for new connections, helo for RSET
    this.isDataMode = false;
  }
}
