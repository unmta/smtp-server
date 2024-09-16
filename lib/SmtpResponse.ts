import { hostname } from 'os';
import { version } from '../package.json';
import fs from 'fs';
import toml from 'toml';

const unfig = toml.parse(fs.readFileSync('unfig.toml', 'utf-8'));
const domain = unfig.smtp.hostname || hostname().toLowerCase();

/**
 * Base class for all SMTP responses.
 * Only if you must respond with something like: "469 4.2.0 I believe you have my stapler", should you use this class directly.
 * Otherwise, use the guardrail classes below that'll keep you within the RFC specs.
 */
export class SmtpResponseAny {
  public readonly code: number;
  public readonly message: string;

  constructor(code: number, message: string | null = null) {
    this.code = code;
    this.message = message || 'Undefined response';
  }
}

/**
 * Connect Responses
 */
const connectAcceptResponses = {
  220: `${domain} ESMTP unMta v${version} ready`,
};
const defaultConnectAcceptCode = 220;
type ConnectAcceptCode = keyof typeof connectAcceptResponses;
export class ConnectAccept extends SmtpResponseAny {
  constructor(code: ConnectAcceptCode, message: string | null) {
    super(code, message || connectAcceptResponses[code]);
  }
}

const connectDeferResponses = {
  421: `4.3.0 ${domain} Service not available, closing transmission channel`,
  450: `4.3.2 ${domain} Service temporarily unavailable, please try again later`,
};
const defaultConnectDeferCode = 421;
type ConnectDeferCode = keyof typeof connectDeferResponses;
export class ConnectDefer extends SmtpResponseAny {
  constructor(code: ConnectDeferCode, message: string | null) {
    super(code, message || connectDeferResponses[code]);
  }
}

const connectRejectResponses = {
  521: `5.3.2 ${domain} does not accept mail`,
  550: `5.7.1 Access denied`,
  554: `5.7.1 Access denied`,
};
const defaultConnectRejectCode = 554;
type ConnectRejectCode = keyof typeof connectRejectResponses;
export class ConnectReject extends SmtpResponseAny {
  constructor(code: ConnectRejectCode, message: string | null) {
    super(code, message || connectRejectResponses[code]);
  }
}

class Connect {
  static accept(code: ConnectAcceptCode = defaultConnectAcceptCode, message: string | null = null) {
    return new ConnectAccept(code, message);
  }
  static defer(code: ConnectDeferCode = defaultConnectDeferCode, message: string | null = null) {
    return new ConnectDefer(code, message);
  }
  static reject(code: ConnectRejectCode = defaultConnectRejectCode, message: string | null = null) {
    return new ConnectReject(code, message);
  }
}

/**
 * Helo Responses
 */
const heloAcceptResponses = {
  250: `${domain} Hello, pleased to meet you`,
};
const defaultHeloAcceptCode = 250;
type HeloAcceptCode = keyof typeof heloAcceptResponses;
export class HeloAccept extends SmtpResponseAny {
  constructor(code: HeloAcceptCode, message: string | null) {
    super(code, message || heloAcceptResponses[code]);
  }
}

const heloDeferResponses = {
  421: `4.3.0 ${domain} Service not available, closing transmission channel`,
  450: `4.2.0 ${domain} Temporary failure, please try again later`,
  451: `4.3.0 ${domain} Temporary server error, please try again later`,
  452: `4.3.1 ${domain} Insufficient system storage, please try again later`,
};
const defaultHeloDeferCode = 421;
type HeloDeferCode = keyof typeof heloDeferResponses;
export class HeloDefer extends SmtpResponseAny {
  constructor(code: HeloDeferCode, message: string | null) {
    super(code, message || heloDeferResponses[code]);
  }
}

const heloRejectResponses = {
  500: `5.5.1 Syntax error, command unrecognized`,
  501: `5.5.2 Syntax error in parameters or arguments`,
  502: `5.5.2 Command not implemented`,
  504: `5.5.4 Command parameter not implemented`,
  550: `5.1.1 Requested action not taken: mailbox unavailable`,
};
const defaultHeloRejectCode = 550;
type HeloRejectCode = keyof typeof heloRejectResponses;
export class HeloReject extends SmtpResponseAny {
  constructor(code: HeloRejectCode, message: string | null) {
    super(code, message || heloRejectResponses[code]);
  }
}

class Helo {
  static accept(code: HeloAcceptCode = defaultHeloAcceptCode, message: string | null = null) {
    return new HeloAccept(code, message);
  }
  static defer(code: HeloDeferCode = defaultHeloDeferCode, message: string | null = null) {
    return new HeloDefer(code, message);
  }
  static reject(code: HeloRejectCode = defaultHeloRejectCode, message: string | null = null) {
    return new HeloReject(code, message);
  }
}

/**
 * Auth Responses
 */
const authAcceptResponses = {
  235: '2.7.0 Authentication successful',
};
const defaultAuthAcceptCode = 235;
type AuthAcceptCode = keyof typeof authAcceptResponses;
export class AuthAccept extends SmtpResponseAny {
  constructor(code: AuthAcceptCode, message: string | null) {
    super(code, message || authAcceptResponses[code]);
  }
}

const authDeferResponses = {
  421: `4.3.0 ${domain} Service not available, closing transmission channel`,
  432: '4.7.12 A password transition is needed',
  450: '4.7.0 Requested mail action not taken: mailbox unavailable',
  451: '4.3.0 Requested action aborted: local error in processing',
  454: '4.7.0 Temporary authentication failure',
};
const defaultAuthDeferCode = 421;
type AuthDeferCode = keyof typeof authDeferResponses;
export class AuthDefer extends SmtpResponseAny {
  constructor(code: AuthDeferCode, message: string | null) {
    super(code, message || authDeferResponses[code]);
  }
}

const authRejectResponses = {
  534: '5.7.9 Authentication mechanism is too weak',
  535: '5.7.8 Authentication credentials invalid',
};
const defaultAuthRejectCode = 535;
type AuthRejectCode = keyof typeof authRejectResponses;
export class AuthReject extends SmtpResponseAny {
  constructor(code: AuthRejectCode, message: string | null) {
    super(code, message || authRejectResponses[code]);
  }
}

class Auth {
  static accept(code: AuthAcceptCode = defaultAuthAcceptCode, message: string | null = null) {
    return new AuthAccept(code, message);
  }
  static defer(code: AuthDeferCode = defaultAuthDeferCode, message: string | null = null) {
    return new AuthDefer(code, message);
  }
  static reject(code: AuthRejectCode = defaultAuthRejectCode, message: string | null = null) {
    return new AuthReject(code, message);
  }
}

/**
 * MailFrom Responses
 */
const mailFromAcceptResponses = {
  250: '2.1.0 OK',
};
const defaultMailFromAcceptCode = 250;
type MailFromAcceptCode = keyof typeof mailFromAcceptResponses;
export class MailFromAccept extends SmtpResponseAny {
  constructor(code: MailFromAcceptCode, message: string | null) {
    super(code, message || mailFromAcceptResponses[code]);
  }
}

const mailFromDeferResponses = {
  421: `4.3.0 ${domain} Service not available, closing transmission channel`,
  450: '4.7.0 Sender address temporarily rejected',
  451: '4.3.0 Temporary server error, please try again later',
  452: '4.3.1 Requested action not taken: insufficient system storage',
};
const defaultMailFromDeferCode = 421;
type MailFromDeferCode = keyof typeof mailFromDeferResponses;
export class MailFromDefer extends SmtpResponseAny {
  constructor(code: MailFromDeferCode, message: string | null) {
    super(code, message || mailFromDeferResponses[code]);
  }
}

const mailFromRejectResponses = {
  501: '5.1.8 Sender address rejected: Domain not allowed',
  550: '5.1.0 Sender address rejected',
  551: '5.1.6 User not local',
  552: '5.2.2 Requested mail action aborted: exceeded storage allocation',
  554: '5.7.8 Sender address rejected: Access denied',
};
const defaultMailFromRejectCode = 550;
type MailFromRejectCode = keyof typeof mailFromRejectResponses;
export class MailFromReject extends SmtpResponseAny {
  constructor(code: MailFromRejectCode, message: string | null) {
    super(code, message || mailFromRejectResponses[code]);
  }
}

class MailFrom {
  static accept(code: MailFromAcceptCode = defaultMailFromAcceptCode, message: string | null = null) {
    return new MailFromAccept(code, message);
  }
  static defer(code: MailFromDeferCode = defaultMailFromDeferCode, message: string | null = null) {
    return new MailFromDefer(code, message);
  }
  static reject(code: MailFromRejectCode = defaultMailFromRejectCode, message: string | null = null) {
    return new MailFromReject(code, message);
  }
}

/**
 * RcptTo Responses
 */
const rcptToAcceptResponses = {
  250: '2.1.5 Recipient OK',
  251: '2.1.5 Recipient not local; relayed as per policy',
};
const defaultRcptToAcceptCode = 250;
type RcptToAcceptCode = keyof typeof rcptToAcceptResponses;
export class RcptToAccept extends SmtpResponseAny {
  constructor(code: RcptToAcceptCode, message: string | null) {
    super(code, message || rcptToAcceptResponses[code]);
  }
}

const rcptToDeferResponses = {
  421: `4.3.0 Temporary failure, please try again later`,
  450: '4.7.0 Mailbox temporarily unavailable, please try again later',
  451: '4.4.1 Recipient temporarily unavailable, please try again later',
  452: '4.3.1 Requested action not taken: insufficient system storage',
};
const defaultRcptToDeferCode = 421;
type RcptToDeferCode = keyof typeof rcptToDeferResponses;
export class RcptToDefer extends SmtpResponseAny {
  constructor(code: RcptToDeferCode, message: string | null) {
    super(code, message || rcptToDeferResponses[code]);
  }
}

const rcptToRejectResponses = {
  550: '5.1.1 Requested action not taken: mailbox unavailable',
  551: '5.1.6 User not local',
  552: '5.2.2 Requested mail action aborted: exceeded storage allocation',
  553: '5.1.3 Requested action not taken: invalid recipient address syntax',
  554: '5.1.0 Address rejected',
};
const defaultRcptToRejectCode = 550;
type RcptToRejectCode = keyof typeof rcptToRejectResponses;
export class RcptToReject extends SmtpResponseAny {
  constructor(code: RcptToRejectCode, message: string | null) {
    super(code, message || rcptToRejectResponses[code]);
  }
}

class RcptTo {
  static accept(code: RcptToAcceptCode = defaultRcptToAcceptCode, message: string | null = null) {
    return new RcptToAccept(code, message);
  }
  static defer(code: RcptToDeferCode = defaultRcptToDeferCode, message: string | null = null) {
    return new RcptToDefer(code, message);
  }
  static reject(code: RcptToRejectCode = defaultRcptToRejectCode, message: string | null = null) {
    return new RcptToReject(code, message);
  }
}

/**
 * DataStart Responses
 */
const dataStartAcceptResponses = {
  354: 'Start mail input; end with <CRLF>.<CRLF>',
};
const defaultDataStartAcceptCode = 354;
type DataStartAcceptCode = keyof typeof dataStartAcceptResponses;
export class DataStartAccept extends SmtpResponseAny {
  constructor(code: DataStartAcceptCode, message: string | null) {
    super(code, message || dataStartAcceptResponses[code]);
  }
}

const dataStartDeferResponses = {
  421: `4.3.0 ${domain} Service not available, closing transmission channel`,
  451: '4.3.0 Requested action aborted: local error in processing',
  452: '4.3.1 Requested action not taken: insufficient system storage',
};
const defaultDataStartDeferCode = 421;
type DataStartDeferCode = keyof typeof dataStartDeferResponses;
export class DataStartDefer extends SmtpResponseAny {
  constructor(code: DataStartDeferCode, message: string | null) {
    super(code, message || dataStartDeferResponses[code]);
  }
}

const dataStartRejectResponses = {
  550: '5.7.1 Access denied: message refused',
  552: '5.2.2 Requested mail action aborted: exceeded storage allocation',
  554: '5.5.1 Command rejected due to invalid parameters or security settings',
};
const defaultDataStartRejectCode = 550;
type DataStartRejectCode = keyof typeof dataStartRejectResponses;
export class DataStartReject extends SmtpResponseAny {
  constructor(code: DataStartRejectCode, message: string | null) {
    super(code, message || dataStartRejectResponses[code]);
  }
}

class DataStart {
  static accept(code: DataStartAcceptCode = defaultDataStartAcceptCode, message: string | null = null) {
    return new DataStartAccept(code, message);
  }
  static defer(code: DataStartDeferCode = defaultDataStartDeferCode, message: string | null = null) {
    return new DataStartDefer(code, message);
  }
  static reject(code: DataStartRejectCode = defaultDataStartRejectCode, message: string | null = null) {
    return new DataStartReject(code, message);
  }
}

/**
 * DataEnd Responses
 */
const dataEndAcceptResponses = {
  250: '2.0.0 OK: Message accepted for delivery',
};
const defaultDataEndAcceptCode = 250;
type DataEndAcceptCode = 250;
export class DataEndAccept extends SmtpResponseAny {
  constructor(code: DataEndAcceptCode, message: string | null) {
    super(code, message || dataEndAcceptResponses[code]);
  }
}

const dataEndDeferResponses = {
  421: `4.3.0 ${domain} Service not available, closing transmission channel`,
  451: '4.3.0 Requested action aborted: local error in processing',
  452: '4.3.1 Requested action not taken: insufficient system storage',
};
const defaultDataEndDeferCode = 451;
type DataEndDeferCode = keyof typeof dataEndDeferResponses;
export class DataEndDefer extends SmtpResponseAny {
  constructor(code: DataEndDeferCode, message: string | null) {
    super(code, message || dataEndDeferResponses[code]);
  }
}

const dataEndRejectResponses = {
  550: '5.7.1 Access denied: message refused',
  552: '5.2.2 Requested mail action aborted: exceeded storage allocation',
  554: '5.5.1 Command rejected due to invalid parameters or security settings',
};
const defaultDataEndRejectCode = 550;
type DataEndRejectCode = keyof typeof dataEndRejectResponses;
export class DataEndReject extends SmtpResponseAny {
  constructor(code: DataEndRejectCode, message: string | null) {
    super(code, message || dataEndRejectResponses[code]);
  }
}

class DataEnd {
  static accept(code: DataEndAcceptCode = defaultDataEndAcceptCode, message: string | null = null) {
    return new DataEndAccept(code, message);
  }
  static defer(code: DataEndDeferCode = defaultDataEndDeferCode, message: string | null = null) {
    return new DataEndDefer(code, message);
  }
  static reject(code: DataEndRejectCode = defaultDataEndRejectCode, message: string | null = null) {
    return new DataEndReject(code, message);
  }
}

/**
 * Quit Responses
 */
const quitAcceptResponses = {
  221: '2.0.0 Stay classy',
};
const defaultQuitAcceptCode = 221;
type QuitAcceptCode = keyof typeof quitAcceptResponses;
export class QuitAccept extends SmtpResponseAny {
  constructor(code: QuitAcceptCode, message: string | null) {
    super(code, message || quitAcceptResponses[code]);
  }
}

const quitDeferResponses = {
  421: `4.3.0 ${domain} Service not available, closing transmission channel`,
};
const defaultQuitDeferCode = 421;
type QuitDeferCode = keyof typeof quitDeferResponses;
export class QuitDefer extends SmtpResponseAny {
  constructor(code: QuitDeferCode, message: string | null) {
    super(code, message || quitDeferResponses[code]);
  }
}

const quitRejectResponses = {
  554: '5.3.0 Server error, closing connection',
};
const defaultQuitRejectCode = 554;
type QuitRejectCode = keyof typeof quitRejectResponses;
export class QuitReject extends SmtpResponseAny {
  constructor(code: QuitRejectCode, message: string | null) {
    super(code, message || quitRejectResponses[code]);
  }
}

class Quit {
  static accept(code: QuitAcceptCode = defaultQuitAcceptCode, message: string | null = null) {
    return new QuitAccept(code, message);
  }
  static defer(code: QuitDeferCode = defaultQuitDeferCode, message: string | null = null) {
    return new QuitDefer(code, message);
  }
  static reject(code: QuitRejectCode = defaultQuitRejectCode, message: string | null = null) {
    return new QuitReject(code, message);
  }
}

/**
 * Rset Responses
 */
const rsetAcceptResponses = {
  250: '2.1.5 OK',
};
const defaultRsetAcceptCode = 250;
type RsetAcceptCode = keyof typeof rsetAcceptResponses;
export class RsetAccept extends SmtpResponseAny {
  constructor(code: RsetAcceptCode, message: string | null) {
    super(code, message || rsetAcceptResponses[code]);
  }
}

const rsetDeferResponses = {
  421: `4.3.0 ${domain} Service not available, closing transmission channel`,
  451: '4.3.0 Requested action aborted: local error in processing',
};
const defaultRsetDeferCode = 451;
type RsetDeferCode = keyof typeof rsetDeferResponses;
export class RsetDefer extends SmtpResponseAny {
  constructor(code: RsetDeferCode, message: string | null) {
    super(code, message || rsetDeferResponses[code]);
  }
}

const rsetRejectResponses = {
  500: '5.5.2 Syntax error, command unrecognized',
  502: '5.5.2 Command not implemented',
};
const defaultRsetRejectCode = 502;
type RsetRejectCode = keyof typeof rsetRejectResponses;
export class RsetReject extends SmtpResponseAny {
  constructor(code: RsetRejectCode, message: string | null) {
    super(code, message || rsetRejectResponses[code]);
  }
}

class Rset {
  static accept(code: RsetAcceptCode = defaultRsetAcceptCode, message: string | null = null) {
    return new RsetAccept(code, message);
  }
  static defer(code: RsetDeferCode = defaultRsetDeferCode, message: string | null = null) {
    return new RsetDefer(code, message);
  }
  static reject(code: RsetRejectCode = defaultRsetRejectCode, message: string | null = null) {
    return new RsetReject(code, message);
  }
}

/**
 * Help Responses
 */
const helpAcceptResponses = {
  211: 'System status: All services running normally',
  214: 'See: https://unmta.com/',
};
const defaultHelpAcceptCode = 214;
type HelpAcceptCode = keyof typeof helpAcceptResponses;
export class HelpAccept extends SmtpResponseAny {
  constructor(code: HelpAcceptCode, message: string | null) {
    super(code, message || helpAcceptResponses[code]);
  }
}

const helpDeferResponses = {
  421: `4.3.0 ${domain} Service not available, closing transmission channel`,
  451: '4.3.0 Requested action aborted: local error in processing',
};
const defaultHelpDeferCode = 451;
type HelpDeferCode = keyof typeof helpDeferResponses;
export class HelpDefer extends SmtpResponseAny {
  constructor(code: HelpDeferCode, message: string | null) {
    super(code, message || helpDeferResponses[code]);
  }
}

const helpRejectResponses = {
  500: '5.5.2 Syntax error, command unrecognized',
  502: '5.5.2 Command not implemented',
};
const defaultHelpRejectCode = 502;
type HelpRejectCode = keyof typeof helpRejectResponses;
export class HelpReject extends SmtpResponseAny {
  constructor(code: HelpRejectCode, message: string | null) {
    super(code, message || helpRejectResponses[code]);
  }
}

class Help {
  static accept(code: HelpAcceptCode = defaultHelpAcceptCode, message: string | null = null) {
    return new HelpAccept(code, message);
  }
  static defer(code: HelpDeferCode = defaultHelpDeferCode, message: string | null = null) {
    return new HelpDefer(code, message);
  }
  static reject(code: HelpRejectCode = defaultHelpRejectCode, message: string | null = null) {
    return new HelpReject(code, message);
  }
}

/**
 * Noop Responses
 */
const noopAcceptResponses = {
  250: '2.0.0 OK',
};
const defaultNoopAcceptCode = 250;
type NoopAcceptCode = keyof typeof noopAcceptResponses;
export class NoopAccept extends SmtpResponseAny {
  constructor(code: NoopAcceptCode, message: string | null) {
    super(code, message || noopAcceptResponses[code]);
  }
}

const noopDeferResponses = {
  421: `4.3.0 ${domain} Service not available, closing transmission channel`,
  451: '4.3.0 Requested action aborted: local error in processing',
};
const defaultNoopDeferCode = 451;
type NoopDeferCode = keyof typeof noopDeferResponses;
export class NoopDefer extends SmtpResponseAny {
  constructor(code: NoopDeferCode, message: string | null) {
    super(code, message || noopDeferResponses[code]);
  }
}

const noopRejectResponses = {
  500: '5.5.2 Syntax error, command unrecognized',
  502: '5.5.2 Command not implemented',
};
const defaultNoopRejectCode = 502;
type NoopRejectCode = keyof typeof noopRejectResponses;
export class NoopReject extends SmtpResponseAny {
  constructor(code: NoopRejectCode, message: string | null) {
    super(code, message || noopRejectResponses[code]);
  }
}

class Noop {
  static accept(code: NoopAcceptCode = defaultNoopAcceptCode, message: string | null = null) {
    return new NoopAccept(code, message);
  }
  static defer(code: NoopDeferCode = defaultNoopDeferCode, message: string | null = null) {
    return new NoopDefer(code, message);
  }
  static reject(code: NoopRejectCode = defaultNoopRejectCode, message: string | null = null) {
    return new NoopReject(code, message);
  }
}

/**
 * Vrfy Responses
 */
const vrfyAcceptResponses = {
  250: '2.1.5 Recipient OK',
  251: '2.1.6 User not local; will forward',
  252: '2.5.0 Cannot VRFY user, but will accept message and attempt delivery',
};
const defaultVrfyAcceptCode = 252;
type VrfyAcceptCode = keyof typeof vrfyAcceptResponses;
export class VrfyAccept extends SmtpResponseAny {
  constructor(code: VrfyAcceptCode, message: string | null) {
    super(code, message || vrfyAcceptResponses[code]);
  }
}

const vrfyDeferResponses = {
  421: `4.3.0 ${domain} Service not available, closing transmission channel`,
  450: '4.7.0 Requested mail action not taken: mailbox unavailable',
  451: '4.3.0 Requested action aborted: local error in processing',
};
const defaultVrfyDeferCode = 451;
type VrfyDeferCode = keyof typeof vrfyDeferResponses;
export class VrfyDefer extends SmtpResponseAny {
  constructor(code: VrfyDeferCode, message: string | null) {
    super(code, message || vrfyDeferResponses[code]);
  }
}

const vrfyRejectResponses = {
  500: '5.5.2 Syntax error, command unrecognized',
  501: '5.5.2 Syntax error in parameters or arguments',
  502: '5.5.2 Command not implemented',
  550: '5.1.1 Requested action not taken: mailbox unavailable',
  551: '5.1.6 User not local',
  554: '5.5.1 Verification not permitted due to policy restrictions',
};
const defaultVrfyRejectCode = 502;
type VrfyRejectCode = keyof typeof vrfyRejectResponses;
export class VrfyReject extends SmtpResponseAny {
  constructor(code: VrfyRejectCode, message: string | null) {
    super(code, message || vrfyRejectResponses[code]);
  }
}

class Vrfy {
  static accept(code: VrfyAcceptCode = defaultVrfyAcceptCode, message: string | null = null) {
    return new VrfyAccept(code, message);
  }
  static defer(code: VrfyDeferCode = defaultVrfyDeferCode, message: string | null = null) {
    return new VrfyDefer(code, message);
  }
  static reject(code: VrfyRejectCode = defaultVrfyRejectCode, message: string | null = null) {
    return new VrfyReject(code, message);
  }
}

/**
 * Unknown Responses
 */
const unknownAcceptResponses = {
  250: '2.1.0 OK',
};
const defaultUnknownAcceptCode = 250;
type UnknownAcceptCode = keyof typeof unknownAcceptResponses;
export class UnknownAccept extends SmtpResponseAny {
  constructor(code: UnknownAcceptCode, message: string | null) {
    super(code, message || unknownAcceptResponses[code]);
  }
}

const unknownDeferResponses = {
  421: `4.3.0 ${domain} Service not available, closing transmission channel`,
  450: '4.7.0 Requested mail action not taken: mailbox unavailable',
  451: '4.3.0 Requested action aborted: local error in processing',
};
const defaultUnknownDeferCode = 451;
type UnknownDeferCode = keyof typeof unknownDeferResponses;
export class UnknownDefer extends SmtpResponseAny {
  constructor(code: UnknownDeferCode, message: string | null) {
    super(code, message || unknownDeferResponses[code]);
  }
}

const unknownRejectResponses = {
  500: '5.5.2 Syntax error, command unrecognized',
  501: '5.5.2 Syntax error in parameters or arguments',
  502: '5.5.2 Command not implemented',
  504: '5.5.2 Command parameter not implemented',
  554: '5.5.1 Command failed',
};
const defaultUnknownRejectCode = 500;
type UnknownRejectCode = keyof typeof unknownRejectResponses;
export class UnknownReject extends SmtpResponseAny {
  constructor(code: UnknownRejectCode, message: string | null) {
    super(code, message || unknownRejectResponses[code]);
  }
}

class Unknown {
  static accept(code: UnknownAcceptCode = defaultUnknownAcceptCode, message: string | null = null) {
    return new UnknownAccept(code, message);
  }
  static defer(code: UnknownDeferCode = defaultUnknownDeferCode, message: string | null = null) {
    return new UnknownDefer(code, message);
  }
  static reject(code: UnknownRejectCode = defaultUnknownRejectCode, message: string | null = null) {
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
  static get Auth() {
    return Auth;
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
