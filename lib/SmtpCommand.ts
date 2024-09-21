// All the commands we'll accept
export const supportedCommands = ['HELO', 'EHLO', 'STARTTLS', 'AUTH', 'MAIL FROM:', 'RCPT TO:', 'DATA', 'QUIT', 'RSET', 'HELP', 'NOOP', 'VRFY'];

// Pipeline-able commands
export const pipelineCommands = ['EHLO', 'MAIL FROM:', 'RCPT TO:', 'DATA', 'QUIT', 'RSET', 'HELP', 'NOOP', 'VRFY'];

export class SmtpCommand {
  public readonly raw: string; // The raw command that was received
  public readonly name: string | undefined; // The command that was received (HELO, MAIL FROM, etc.)
  public readonly argument: string | undefined; // The argument that was received (email address, etc.)
  public readonly parameters: string[] = []; // The parameters that were received (e.g. the extensions in MAIL FROM)

  constructor(data: string) {
    this.raw = data;
    this.name = supportedCommands.find((command) => this.raw.toUpperCase().startsWith(command));
    if (this.name) {
      this.argument = this.raw.slice(this.name.length).trim(); // Extract the argument
    }
    if (this.argument) {
      this.parameters = this.argument.split(/\s+/);
    }
  }
}
