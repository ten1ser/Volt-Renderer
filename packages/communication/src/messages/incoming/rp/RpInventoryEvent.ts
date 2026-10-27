import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpInventoryParser } from '../../parser/rp';

export class RpInventoryEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpInventoryParser); }
    public getParser(): RpInventoryParser { return this.parser as RpInventoryParser; }
}
