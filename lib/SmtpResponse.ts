import { hostname } from 'os';
import { version } from '../package.json';
import unfig from '../unfig.toml';

const domain = unfig.smtp.hostname || hostname().toLowerCase();

export const smtpResponses: { [key: number]: string } = {
  211: 'System status: All services running normally',
  214: 'See: https://unmta.com/',
  220: `${domain} ESMTP unMta v${version} ready`,
  221: `${domain} Service ready`,
  235: 'Service closing transmission channel',
  250: 'Requested mail action okay, completed',
  251: 'User not local; will forward',
  252: 'Cannot VRFY user, but will accept message and attempt delivery',
  // 334: '',
  354: 'Start mail input; end with <CRLF>.<CRLF>',
  421: `${domain} Service not available, closing transmission channel`, // Will close connection (https://datatracker.ietf.org/doc/html/rfc5321#section-3.8)
  450: 'Requested mail action not taken: mailbox unavailable',
  451: 'Requested action aborted: local error in processing',
  452: 'Requested action not taken: insufficient system storage',
  455: 'Server unable to accommodate parameters',
  500: 'Syntax error, command unrecognized',
  501: 'Syntax error in parameters or arguments',
  502: 'Command not implemented',
  503: 'Bad sequence of commands',
  504: 'Command parameter not implemented',
  521: `${domain} does not accept mail`, // https://datatracker.ietf.org/doc/html/rfc1846
  // 535: '',
  541: 'Message rejected due to content policy violation', //Non-standard but used by some mail servers
  550: 'Requested action not taken: mailbox unavailable',
  551: 'User not local',
  552: 'Requested mail action aborted: exceeded storage allocation',
  553: 'Requested action not taken: mailbox unavailable',
  554: 'Transaction failed',
  555: 'MAIL FROM/RCPT TO parameters not recognized or not implemented',
};

/**
 * Base class for all SMTP responses.
 * Only if you must respond with something like: "469 I believe you have my stapler", should you use this class directly.
 * Otherwise, use the guardrail classes below that'll keep you within the RFC specs.
 */
export class SmtpResponseAny {
  public readonly code: number;
  public readonly message: string;

  constructor(code: number, message: string | null = null) {
    this.code = code;
    this.message = message || smtpResponses[code] || 'Undefined response';
  }
}

/**
 * Connect Responses
 */
type ConnectAcceptCode = 220;
const DefaultConnectAcceptCode = 220;
export class ConnectAccept extends SmtpResponseAny {
  constructor(code: ConnectAcceptCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type ConnectDeferCode = 421 | 450;
const DefaultConnectDeferCode = 421;
export class ConnectDefer extends SmtpResponseAny {
  constructor(code: ConnectDeferCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type ConnectRejectCode = 521 | 541 | 550 | 554;
const DefaultConnectRejectCode = 554;
export class ConnectReject extends SmtpResponseAny {
  constructor(code: ConnectRejectCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

class Connect {
  static accept(code: ConnectAcceptCode = DefaultConnectAcceptCode, message: string | null = null) {
    return new ConnectAccept(code, message);
  }
  static defer(code: ConnectDeferCode = DefaultConnectDeferCode, message: string | null = null) {
    return new ConnectDefer(code, message);
  }
  static reject(code: ConnectRejectCode = DefaultConnectRejectCode, message: string | null = null) {
    return new ConnectReject(code, message);
  }
}

/**
 * Helo Responses
 */
type HeloAcceptCode = 250;
const DefaultHeloAcceptCode = 250;
export class HeloAccept extends SmtpResponseAny {
  constructor(code: HeloAcceptCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type HeloDeferCode = 421 | 450 | 451 | 452;
const DefaultHeloDeferCode = 421;
export class HeloDefer extends SmtpResponseAny {
  constructor(code: HeloDeferCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type HeloRejectCode = 500 | 501 | 502 | 504 | 550;
const DefaultHeloRejectCode = 550;
export class HeloReject extends SmtpResponseAny {
  constructor(code: HeloRejectCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

class Helo {
  static accept(code: HeloAcceptCode = DefaultHeloAcceptCode, message: string | null = null) {
    return new HeloAccept(code, message);
  }
  static defer(code: HeloDeferCode = DefaultHeloDeferCode, message: string | null = null) {
    return new HeloDefer(code, message);
  }
  static reject(code: HeloRejectCode = DefaultHeloRejectCode, message: string | null = null) {
    return new HeloReject(code, message);
  }
}

/**
 * MailFrom Responses
 */
type MailFromAcceptCode = 250;
const DefaultMailFromAcceptCode = 250;
export class MailFromAccept extends SmtpResponseAny {
  constructor(code: MailFromAcceptCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type MailFromDeferCode = 421 | 450 | 451 | 452;
const DefaultMailFromDeferCode = 421;
export class MailFromDefer extends SmtpResponseAny {
  constructor(code: MailFromDeferCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type MailFromRejectCode = 550 | 551 | 552 | 553 | 554;
const DefaultMailFromRejectCode = 550;
export class MailFromReject extends SmtpResponseAny {
  constructor(code: MailFromRejectCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

class MailFrom {
  static accept(code: MailFromAcceptCode = DefaultMailFromAcceptCode, message: string | null = null) {
    return new MailFromAccept(code, message);
  }
  static defer(code: MailFromDeferCode = DefaultMailFromDeferCode, message: string | null = null) {
    return new MailFromDefer(code, message);
  }
  static reject(code: MailFromRejectCode = DefaultMailFromRejectCode, message: string | null = null) {
    return new MailFromReject(code, message);
  }
}

/**
 * RcptTo Responses
 */
type RcptToAcceptCode = 250 | 251;
const DefaultRcptToAcceptCode = 250;
export class RcptToAccept extends SmtpResponseAny {
  constructor(code: RcptToAcceptCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type RcptToDeferCode = 421 | 450 | 451 | 452;
const DefaultRcptToDeferCode = 421;
export class RcptToDefer extends SmtpResponseAny {
  constructor(code: RcptToDeferCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type RcptToRejectCode = 550 | 551 | 552 | 553 | 554;
const DefaultRcptToRejectCode = 550;
export class RcptToReject extends SmtpResponseAny {
  constructor(code: RcptToRejectCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

class RcptTo {
  static accept(code: RcptToAcceptCode = DefaultRcptToAcceptCode, message: string | null = null) {
    return new RcptToAccept(code, message);
  }
  static defer(code: RcptToDeferCode = DefaultRcptToDeferCode, message: string | null = null) {
    return new RcptToDefer(code, message);
  }
  static reject(code: RcptToRejectCode = DefaultRcptToRejectCode, message: string | null = null) {
    return new RcptToReject(code, message);
  }
}

/**
 * DataStart Responses
 */
type DataStartAcceptCode = 354;
const DefaultDataStartAcceptCode = 354;
export class DataStartAccept extends SmtpResponseAny {
  constructor(code: DataStartAcceptCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type DataStartDeferCode = 421 | 451 | 452;
const DefaultDataStartDeferCode = 421;
export class DataStartDefer extends SmtpResponseAny {
  constructor(code: DataStartDeferCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type DataStartRejectCode = 550 | 552 | 554;
const DefaultDataStartRejectCode = 550;
export class DataStartReject extends SmtpResponseAny {
  constructor(code: DataStartRejectCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

class DataStart {
  static accept(code: DataStartAcceptCode = DefaultDataStartAcceptCode, message: string | null = null) {
    return new DataStartAccept(code, message);
  }
  static defer(code: DataStartDeferCode = DefaultDataStartDeferCode, message: string | null = null) {
    return new DataStartDefer(code, message);
  }
  static reject(code: DataStartRejectCode = DefaultDataStartRejectCode, message: string | null = null) {
    return new DataStartReject(code, message);
  }
}

/**
 * DataEnd Responses
 */
type DataEndAcceptCode = 250;
const DefaultDataEndAcceptCode = 250;
export class DataEndAccept extends SmtpResponseAny {
  constructor(code: DataEndAcceptCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type DataEndDeferCode = 421 | 451 | 452;
const DefaultDataEndDeferCode = 451;
export class DataEndDefer extends SmtpResponseAny {
  constructor(code: DataEndDeferCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type DataEndRejectCode = 550 | 552 | 553 | 554;
const DefaultDataEndRejectCode = 550;
export class DataEndReject extends SmtpResponseAny {
  constructor(code: DataEndRejectCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

class DataEnd {
  static accept(code: DataEndAcceptCode = DefaultDataEndAcceptCode, message: string | null = null) {
    return new DataEndAccept(code, message);
  }
  static defer(code: DataEndDeferCode = DefaultDataEndDeferCode, message: string | null = null) {
    return new DataEndDefer(code, message);
  }
  static reject(code: DataEndRejectCode = DefaultDataEndRejectCode, message: string | null = null) {
    return new DataEndReject(code, message);
  }
}

/**
 * Quit Responses
 */
type QuitAcceptCode = 221;
const DefaultQuitAcceptCode = 221;
export class QuitAccept extends SmtpResponseAny {
  constructor(code: QuitAcceptCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type QuitDeferCode = 421;
const DefaultQuitDeferCode = 421;
export class QuitDefer extends SmtpResponseAny {
  constructor(code: QuitDeferCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type QuitRejectCode = 500 | 501 | 554;
const DefaultQuitRejectCode = 554;
export class QuitReject extends SmtpResponseAny {
  constructor(code: QuitRejectCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

class Quit {
  static accept(code: QuitAcceptCode = DefaultQuitAcceptCode, message: string | null = null) {
    return new QuitAccept(code, message);
  }
  static defer(code: QuitDeferCode = DefaultQuitDeferCode, message: string | null = null) {
    return new QuitDefer(code, message);
  }
  static reject(code: QuitRejectCode = DefaultQuitRejectCode, message: string | null = null) {
    return new QuitReject(code, message);
  }
}

/**
 * Rset Responses
 */
type RsetAcceptCode = 250;
const DefaultRsetAcceptCode = 250;
export class RsetAccept extends SmtpResponseAny {
  constructor(code: RsetAcceptCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type RsetDeferCode = 421 | 451;
const DefaultRsetDeferCode = 451;
export class RsetDefer extends SmtpResponseAny {
  constructor(code: RsetDeferCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type RsetRejectCode = 500 | 502 | 504;
const DefaultRsetRejectCode = 500;
export class RsetReject extends SmtpResponseAny {
  constructor(code: RsetRejectCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

class Rset {
  static accept(code: RsetAcceptCode = DefaultRsetAcceptCode, message: string | null = null) {
    return new RsetAccept(code, message);
  }
  static defer(code: RsetDeferCode = DefaultRsetDeferCode, message: string | null = null) {
    return new RsetDefer(code, message);
  }
  static reject(code: RsetRejectCode = DefaultRsetRejectCode, message: string | null = null) {
    return new RsetReject(code, message);
  }
}

/**
 * Help Responses
 */
type HelpAcceptCode = 211 | 214;
const DefaultHelpAcceptCode = 214;
export class HelpAccept extends SmtpResponseAny {
  constructor(code: HelpAcceptCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type HelpDeferCode = 421 | 451;
const DefaultHelpDeferCode = 451;
export class HelpDefer extends SmtpResponseAny {
  constructor(code: HelpDeferCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type HelpRejectCode = 500 | 501 | 502 | 504;
const DefaultHelpRejectCode = 500;
export class HelpReject extends SmtpResponseAny {
  constructor(code: HelpRejectCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

class Help {
  static accept(code: HelpAcceptCode = DefaultHelpAcceptCode, message: string | null = null) {
    return new HelpAccept(code, message);
  }
  static defer(code: HelpDeferCode = DefaultHelpDeferCode, message: string | null = null) {
    return new HelpDefer(code, message);
  }
  static reject(code: HelpRejectCode = DefaultHelpRejectCode, message: string | null = null) {
    return new HelpReject(code, message);
  }
}

/**
 * Noop Responses
 */
type NoopAcceptCode = 250;
const DefaultNoopAcceptCode = 250;
export class NoopAccept extends SmtpResponseAny {
  constructor(code: NoopAcceptCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type NoopDeferCode = 421 | 451;
const DefaultNoopDeferCode = 451;
export class NoopDefer extends SmtpResponseAny {
  constructor(code: NoopDeferCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type NoopRejectCode = 500 | 502 | 504;
const DefaultNoopRejectCode = 500;
export class NoopReject extends SmtpResponseAny {
  constructor(code: NoopRejectCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

class Noop {
  static accept(code: NoopAcceptCode = DefaultNoopAcceptCode, message: string | null = null) {
    return new NoopAccept(code, message);
  }
  static defer(code: NoopDeferCode = DefaultNoopDeferCode, message: string | null = null) {
    return new NoopDefer(code, message);
  }
  static reject(code: NoopRejectCode = DefaultNoopRejectCode, message: string | null = null) {
    return new NoopReject(code, message);
  }
}

/**
 * Vrfy Responses
 */
type VrfyAcceptCode = 250 | 251 | 252;
const DefaultVrfyAcceptCode = 252;
export class VrfyAccept extends SmtpResponseAny {
  constructor(code: VrfyAcceptCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type VrfyDeferCode = 421 | 450 | 451 | 452;
const DefaultVrfyDeferCode = 451;
export class VrfyDefer extends SmtpResponseAny {
  constructor(code: VrfyDeferCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type VrfyRejectCode = 500 | 501 | 502 | 550 | 551 | 553 | 554;
const DefaultVrfyRejectCode = 502;
export class VrfyReject extends SmtpResponseAny {
  constructor(code: VrfyRejectCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

class Vrfy {
  static accept(code: VrfyAcceptCode = DefaultVrfyAcceptCode, message: string | null = null) {
    return new VrfyAccept(code, message);
  }
  static defer(code: VrfyDeferCode = DefaultVrfyDeferCode, message: string | null = null) {
    return new VrfyDefer(code, message);
  }
  static reject(code: VrfyRejectCode = DefaultVrfyRejectCode, message: string | null = null) {
    return new VrfyReject(code, message);
  }
}

/**
 * Unknown Responses
 */
type UnknownAcceptCode = 250;
const DefaultUnknownAcceptCode = 250;
export class UnknownAccept extends SmtpResponseAny {
  constructor(code: UnknownAcceptCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type UnknownDeferCode = 421 | 451 | 455;
const DefaultUnknownDeferCode = 451;
export class UnknownDefer extends SmtpResponseAny {
  constructor(code: UnknownDeferCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

type UnknownRejectCode = 500 | 501 | 502 | 503 | 504 | 550 | 554;
const DefaultUnknownRejectCode = 500;
export class UnknownReject extends SmtpResponseAny {
  constructor(code: UnknownRejectCode, message: string | null) {
    super(code, message || smtpResponses[code]);
  }
}

class Unknown {
  static accept(code: UnknownAcceptCode = DefaultUnknownAcceptCode, message: string | null = null) {
    return new UnknownAccept(code, message);
  }
  static defer(code: UnknownDeferCode = DefaultUnknownDeferCode, message: string | null = null) {
    return new UnknownDefer(code, message);
  }
  static reject(code: UnknownRejectCode = DefaultUnknownRejectCode, message: string | null = null) {
    return new UnknownReject(code, message);
  }
}

export class SmtpResponse {
  static get Connect() {
    return Connect;
  }
  static get Helo() {
    return Helo;
  }
  static get MailFrom() {
    return MailFrom;
  }
  static get RcptTo() {
    return RcptTo;
  }
  static get DataStart() {
    return DataStart;
  }
  static get DataEnd() {
    return DataEnd;
  }
  static get Quit() {
    return Quit;
  }
  static get Rset() {
    return Rset;
  }
  static get Help() {
    return Help;
  }
  static get Noop() {
    return Noop;
  }
  static get Vrfy() {
    return Vrfy;
  }
  static get Unknown() {
    return Unknown;
  }
}

// Add auth response
// add (modify?) session data
// if rejected, don't allow further accepting in that smtp session (in some cases? ex: greylisting)
// based on response (namely reject), don't run any other plugins for that event
// for rcpt to (and maybe others), if rejected, other commands SHOULD be allowed
// Need to be able to handle multi-line EHLO response?
