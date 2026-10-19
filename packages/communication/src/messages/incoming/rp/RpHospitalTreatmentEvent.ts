import { IMessageEvent } from '@volt/api';
import { MessageEvent } from '@volt/events';
import { RpHospitalTreatmentParser } from '../../parser/rp';

export class RpHospitalTreatmentEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: Function)
    {
        super(callback, RpHospitalTreatmentParser);
    }

    public getParser(): RpHospitalTreatmentParser
    {
        return this.parser as RpHospitalTreatmentParser;
    }
}
