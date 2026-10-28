import { IMessageComposer } from '@volt/api';

const NUMBER_LENGTH = 24;

// action: 0 dial the number, 1 answer, 2 hang up or decline, 3 call a contact (number is their user id).
export class RpPhoneCallActionComposer implements IMessageComposer<[number, string]>
{
    private _data: [number, string];

    constructor(action: number, number: string)
    {
        if(!Number.isInteger(action) || action < 0 || action > 3) throw new RangeError('action must be 0..3');
        if(typeof number !== 'string' || number.length > NUMBER_LENGTH) throw new RangeError('number must be at most 24 characters');

        this._data = [action, number];
    }

    public getMessageArray(): [number, string]
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
