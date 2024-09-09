export default class SmtpCommand {
  private commands = ['HELO', 'EHLO', 'MAIL FROM:', 'RCPT TO:', 'DATA', 'QUIT', 'RSET', 'HELP', 'NOOP', 'VRFY'];

  public readonly message: string; // The raw message that was received
  public readonly name: string | undefined; // The command that was received (HELO, MAIL FROM, etc.)
  public readonly argument: string | undefined; // The argument that was received (email address, etc.)

  constructor(data: Buffer) {
    this.message = data.toString().trim();
    this.name = this.commands.find((command) => this.message.toUpperCase().startsWith(command));
    if (this.name) {
      this.argument = this.message.slice(this.name.length).trim(); // Extract the argument
    }
  }
}
