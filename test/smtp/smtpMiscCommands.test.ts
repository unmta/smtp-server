// Tests the "off brand" SMTP commands and responses

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { naiveSmtpClient } from '../lib/naiveSmtpClient';

const smtpClient = new naiveSmtpClient('localhost', 2525);

beforeAll(async () => {
  await smtpClient.connect();
});

afterAll(async () => {
  await smtpClient.send('QUIT');
  await smtpClient.receive();
});

describe('SMTP Server', async () => {
  it('should respond to NOOP command', async () => {
    await smtpClient.receive();
    await smtpClient.send('NOOP');
    const response = await smtpClient.receive();
    expect(response).toContain('250 2.0.0 OK');
  });

  it('should respond to HELP command', async () => {
    await smtpClient.send('HELP');
    const response = await smtpClient.receive();
    expect(response).toContain('214 See: https://unmta.com/');
  });

  it('should respond to VRFY command', async () => {
    await smtpClient.send('VRFY');
    const response = await smtpClient.receive();
    expect(response).toContain('252 2.5.0 Cannot VRFY user, but will accept message and attempt delivery');
  });

  it('should respond to RSET command', async () => {
    await smtpClient.send('RSET');
    const response1 = await smtpClient.receive();
    expect(response1).toContain('250 2.1.5 OK');
  });

  it('should respond to invalid command', async () => {
    await smtpClient.send('OHHI MARK');
    const response1 = await smtpClient.receive();
    expect(response1).toContain('500 5.5.2 Syntax error, command unrecognized');
  });
});
