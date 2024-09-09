const responses: { [key: number]: string } = {
  211: '',
  214: '',
  220: '',
  221: '',
  235: '',
  250: '',
  251: '',
  252: '',
  334: '',
  354: '',
  421: '',
  450: '',
  451: '',
  452: '',
  455: '',
  500: '',
  501: '',
  502: '',
  503: '',
  504: '',
  521: '',
  535: '',
  541: '',
  550: '',
  551: '',
  552: '',
  553: '',
  554: '',
};

abstract class UnMtaResponse {
  protected abstract code: number;
  protected message: string;

  constructor(message: string) {
    this.message = message;
  }
}

type HelpAcceptResponseCode = 211 | 214;
export class HelpAcceptResponse extends UnMtaResponse {
  protected code: HelpAcceptResponseCode;

  constructor(code: HelpAcceptResponseCode = 214, message: string | null = null) {
    super(message || responses[code]);
    this.code = code;
  }
}

type HelpDeferResponseCode = 421 | 451;
export class HelpDeferResponse extends UnMtaResponse {
  protected code: HelpDeferResponseCode;

  constructor(code: HelpDeferResponseCode = 451, message: string) {
    super(message || responses[code]);
    this.code = code;
  }
}

type HelpRejectResponseCode = 500 | 501 | 502 | 504;
export class HelpRejectResponse extends UnMtaResponse {
  protected code: HelpRejectResponseCode;

  constructor(code: HelpRejectResponseCode = 500, message: string) {
    super(message || responses[code]);
    this.code = code;
  }
}

// type AcceptResponseCode = 214 | 220 | 221 | 235 | 250 | 251 | 252;
// export class AcceptResponse extends UnMtaResponse {
//   constructor(message: string, data: any = null) {
//     super(250, message, data);
//   }
// }

// type TempFailCode = 421 | 450 | 451 | 452 | 455;
// export class TempFailResponse extends UnMtaResponse {
//   constructor(message: string, data: any = null) {
//     super(450, message, data);
//   }
// }

// type PermFailCode = 500 | 501 | 502 | 503 | 504 | 521 | 535 | 541 | 550 | 551 | 552 | 553 | 554;
// export class PermFailResponse extends UnMtaResponse {
//   protected code: PermFailCode;

//   constructor(message: string, data: any = null) {
//     super(550, message, data);
//     this.code = 550;
//   }
// }

// SEVERAL of these only apply to a specific command (ex: 214 only applies to HELP)
// DATA response should only accept fails or 354 code
// Add auth response
// Set response
// add (modify?) session data
// accept/reject (or do nothing)
// if rejected, don't allow further accepting in that smtp session (in some cases? ex: greylisting)
// based on response (namely reject), don't run any other plugins for that event
// for rcpt to (and maybe others), if rejected, other commands SHOULD be allowed
