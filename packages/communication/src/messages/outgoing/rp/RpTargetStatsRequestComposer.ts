import { IMessageComposer } from '@volt/api';

const MAX_INT32 = 2147483647;

const isPositiveInt32 = (value: number): boolean => Number.isInteger(value) && value > 0 && value <= MAX_INT32;

export class RpTargetStatsRequestComposer implements IMessageComposer<[number, number, number]>
{
    private _data: [number, number, number];

    constructor(requestId: number, roomId: number, targetUserId: number)
    {
        if(!isPositiveInt32(requestId)) throw new RangeError('requestId must be a positive int32');
        if(!isPositiveInt32(roomId)) throw new RangeError('roomId must be a positive int32');
        if(!isPositiveInt32(targetUserId)) throw new RangeError('targetUserId must be a positive int32');

        this._data = [requestId, roomId, targetUserId];
    }

    public getMessageArray(): [number, number, number]
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
