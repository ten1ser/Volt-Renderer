import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpCityParser } from '../../parser/rp';

export class RpCityEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpCityParser); }
    public getParser(): RpCityParser { return this.parser as RpCityParser; }
}
