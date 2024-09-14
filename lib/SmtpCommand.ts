export default class SmtpCommand {
  private commands = ['HELO', 'EHLO', 'AUTH', 'MAIL FROM:', 'RCPT TO:', 'DATA', 'QUIT', 'RSET', 'HELP', 'NOOP', 'VRFY'];

  public readonly raw: string; // The raw command that was received
  public readonly name: string | undefined; // The command that was received (HELO, MAIL FROM, etc.)
  public readonly argument: string | undefined; // The argument that was received (email address, etc.)

  constructor(data: Buffer) {
    this.raw = data.toString().trim();
    this.name = this.commands.find((command) => this.raw.toUpperCase().startsWith(command));
    if (this.name) {
      this.argument = this.raw.slice(this.name.length).trim(); // Extract the argument
    }
  }
}
