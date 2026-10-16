import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpStatsParser } from '../../parser/rp';

export class RpStatsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function)
    {
        super(callback, RpStatsParser);
    }

    public getParser(): RpStatsParser
    {
        return this.parser as RpStatsParser;
    }
}
