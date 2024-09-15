// Tests basic SMTP commands and responses

import { describe, it, expect, beforeAll } from 'bun:test';
import { naiveSmtpClient } from '../lib/naiveSmtpClient';

const smtpClient = new naiveSmtpClient('localhost', 2525);

beforeAll(async () => {
  await smtpClient.connect();
});

describe('SMTP Server', async () => {
  it('should respond with a greeting message', async () => {
    const response = await smtpClient.receive(); // Expect greeting upon connecting
    expect(response).toContain('220 ');
  });

  it('should respond with a 250 OK', async () => {
    await smtpClient.send('HELO example.com');
    const response = await smtpClient.receive();
    expect(response).toContain('250 ');
  });

  it('should respond to MAIL FROM command', async () => {
    await smtpClient.send('MAIL FROM:<test@example.com>');
    const response = await smtpClient.receive();
    expect(response).toContain('250 2.1.0 OK');
  });

  it('should respond to RCPT TO command', async () => {
    await smtpClient.send('RCPT TO:<recipient@example.com>');
    const response = await smtpClient.receive();
    expect(response).toContain('250 2.1.0 OK');
  });

  it('should handle the DATA command and accept the message', async () => {
    await smtpClient.send('DATA');
    const response1 = await smtpClient.receive();
    expect(response1).toContain('354 Start mail input; end with <CRLF>.<CRLF>');

    await smtpClient.send('This is a test message..\r\n.');
    const response2 = await smtpClient.receive();
    expect(response2).toContain('250 2.0.0 OK: Message accepted for delivery');
  });

  it('should close the connection when QUIT is received', async () => {
    await smtpClient.send('QUIT');
    const response = await smtpClient.receive();
    expect(response).toContain('221 2.0.0 Stay classy');
  });
});
