import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpTargetStatsParser } from '../../parser/rp';

export class RpTargetStatsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function)
    {
        super(callback, RpTargetStatsParser);
    }

    public getParser(): RpTargetStatsParser
    {
        return this.parser as RpTargetStatsParser;
    }
}
