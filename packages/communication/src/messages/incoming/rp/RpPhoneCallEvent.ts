import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpPhoneCallParser } from '../../parser/rp';

export class RpPhoneCallEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpPhoneCallParser); }
    public getParser(): RpPhoneCallParser { return this.parser as RpPhoneCallParser; }
}
