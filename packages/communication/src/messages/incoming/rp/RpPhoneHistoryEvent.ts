import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpPhoneHistoryParser } from '../../parser/rp';

export class RpPhoneHistoryEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpPhoneHistoryParser); }
    public getParser(): RpPhoneHistoryParser { return this.parser as RpPhoneHistoryParser; }
}
