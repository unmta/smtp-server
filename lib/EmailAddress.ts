import { Address as rfc2821 } from 'address-rfc2821';

// Parse rfc2821 email address
export class EnvelopeAddress {
  public address: string | undefined;
  public local: string | undefined;
  public domain: string | undefined;

  constructor(address: string) {
    try {
      const parsed = new rfc2821(address);
      this.local = parsed.user;
      this.domain = parsed.host;
      this.address = `${this.local}@${this.domain}`;
    } catch (error) {}
  }
}
