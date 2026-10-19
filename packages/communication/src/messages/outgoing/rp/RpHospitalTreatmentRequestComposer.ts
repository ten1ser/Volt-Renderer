import { IMessageComposer } from '@volt/api';

export class RpHospitalTreatmentRequestComposer implements IMessageComposer<[]>
{
    public getMessageArray(): [] { return []; }
    public dispose(): void { }
}
