import { IMessageComposer } from '@volt/api';

const MAX_INT32 = 2147483647;

const isPositiveInt32 = (value: number): boolean => Number.isInteger(value) && value >= 1 && value <= MAX_INT32;

// Reads another player's RP profile card: gang, job and rank, and fight counters.
export class RpProfileRequestComposer implements IMessageComposer<[number, number]>
{
    private _data: [number, number];

    constructor(requestId: number, userId: number)
    {
        if(!isPositiveInt32(requestId)) throw new RangeError('requestId must be a positive int32');
        if(!isPositiveInt32(userId)) throw new RangeError('userId must be a positive int32');

        this._data = [requestId, userId];
    }

    public getMessageArray(): [number, number]
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
