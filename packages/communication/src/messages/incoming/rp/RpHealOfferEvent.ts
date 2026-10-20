import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpHealOfferParser } from '../../parser/rp';

export class RpHealOfferEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpHealOfferParser); }
    public getParser(): RpHealOfferParser { return this.parser as RpHealOfferParser; }
}
