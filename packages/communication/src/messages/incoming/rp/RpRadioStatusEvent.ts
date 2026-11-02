import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpRadioStatusParser } from '../../parser/rp';

export class RpRadioStatusEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpRadioStatusParser); }
    public getParser(): RpRadioStatusParser { return this.parser as RpRadioStatusParser; }
}