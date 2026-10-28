import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpProfileParser } from '../../parser/rp';

export class RpProfileEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpProfileParser); }
    public getParser(): RpProfileParser { return this.parser as RpProfileParser; }
}
