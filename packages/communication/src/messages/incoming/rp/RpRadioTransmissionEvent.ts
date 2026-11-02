import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpRadioTransmissionParser } from '../../parser/rp';

export class RpRadioTransmissionEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function) { super(callback, RpRadioTransmissionParser); }
    public getParser(): RpRadioTransmissionParser { return this.parser as RpRadioTransmissionParser; }
}