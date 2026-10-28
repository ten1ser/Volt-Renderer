import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpPhoneOfferParser } from '../../parser/rp';

export class RpPhoneOfferEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpPhoneOfferParser); }
    public getParser(): RpPhoneOfferParser { return this.parser as RpPhoneOfferParser; }
}
