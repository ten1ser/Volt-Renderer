import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpBusinessParser } from '../../parser/rp';

export class RpBusinessEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpBusinessParser); }
    public getParser(): RpBusinessParser { return this.parser as RpBusinessParser; }
}
