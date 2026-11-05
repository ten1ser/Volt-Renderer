import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpActionProgressParser } from '../../parser/rp';

export class RpActionProgressEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpActionProgressParser); }
    public getParser(): RpActionProgressParser { return this.parser as RpActionProgressParser; }
}
