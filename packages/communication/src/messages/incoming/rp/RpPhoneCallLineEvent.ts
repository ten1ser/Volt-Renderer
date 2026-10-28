import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpPhoneCallLineParser } from '../../parser/rp';

export class RpPhoneCallLineEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpPhoneCallLineParser); }
    public getParser(): RpPhoneCallLineParser { return this.parser as RpPhoneCallLineParser; }
}
