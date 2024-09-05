const rfc2821 = require('address-rfc2821').Address;
const rfc2822 = require('address-rfc2822');

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
