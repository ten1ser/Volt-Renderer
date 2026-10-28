import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpPhoneLocationParser } from '../../parser/rp';

export class RpPhoneLocationEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpPhoneLocationParser); }
    public getParser(): RpPhoneLocationParser { return this.parser as RpPhoneLocationParser; }
}
