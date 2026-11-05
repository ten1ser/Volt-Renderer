import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpFeedLineParser } from '../../parser/rp';

export class RpFeedLineEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpFeedLineParser); }
    public getParser(): RpFeedLineParser { return this.parser as RpFeedLineParser; }
}
