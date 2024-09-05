import { EnvelopeAddress } from './EmailAddress';

export class SMTPSession {
  // The current phase of the SMTP session
  public id: number; // A unique identifier for the session
  public phase: 'connection' | 'helo' | 'sender' | 'recipient' | 'data' | 'termination';
  public sender: EnvelopeAddress | null = null;
  public recipients: EnvelopeAddress[] = [];

  constructor(id: number) {
    this.id = id;
    this.phase = 'connection';
  }
}
