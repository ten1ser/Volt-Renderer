import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpPhoneStatusParser } from '../../parser/rp';

export class RpPhoneStatusEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpPhoneStatusParser); }
    public getParser(): RpPhoneStatusParser { return this.parser as RpPhoneStatusParser; }
}
