import { IMessageComposer } from '@volt/api';

const MAX_INT32 = 2147483647;
const VALUE_LENGTH = 32;

// action: 0 status, 1 factory reset (value RESET), 2 add a contact by number (value the number), 3 call history,
// 4 locate a contact (value their user id), 5 share location (value 1 or 0).
export class RpPhoneRequestComposer implements IMessageComposer<[number, number, string]>
{
    private _data: [number, number, string];

    constructor(requestId: number, action: number, value: string)
    {
        if(!Number.isInteger(requestId) || requestId < 1 || requestId > MAX_INT32) throw new RangeError('requestId must be a positive int32');
        if(!Number.isInteger(action) || action < 0 || action > 5) throw new RangeError('action must be 0..5');
        if(typeof value !== 'string' || value.length > VALUE_LENGTH) throw new RangeError('value must be at most 32 characters');

        this._data = [requestId, action, value];
    }

    public getMessageArray(): [number, number, string]
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
