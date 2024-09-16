declare module 'address-rfc2821' {
  class Address {
    constructor(user: string, host?: string);
    original: string;
    user: string;
    original_host: string;
    is_utf8: boolean;
    host: string;
    parse(addr: string): void;
    isNull(): 0 | 1;
    format(use_punycode: string): string;
    address(set: string, use_punycode: boolean): string;
    toString(): string;
  }
}
