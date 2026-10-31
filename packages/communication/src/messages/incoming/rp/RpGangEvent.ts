import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpGangParser } from '../../parser/rp';

export class RpGangEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpGangParser); }
    public getParser(): RpGangParser { return this.parser as RpGangParser; }
}
