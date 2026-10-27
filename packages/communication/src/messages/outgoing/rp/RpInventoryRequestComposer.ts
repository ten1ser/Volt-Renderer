import { IMessageComposer } from '@volt/api';

const MAX_INT32 = 2147483647;
const SLOT_COUNT = 10;

const isIntInRange = (value: number, min: number, max: number): boolean => Number.isInteger(value) && value >= min && value <= max;

// action: 0 read, 1 move, 2 use, 3 drop, 4 destroy. Slots 1..10 (0 when unused), targetUserId 0 for none.
export class RpInventoryRequestComposer implements IMessageComposer<[number, number, number, number, number]>
{
    private _data: [number, number, number, number, number];

    constructor(requestId: number, action: number, fromSlot: number, toSlot: number, targetUserId: number)
    {
        if(!isIntInRange(requestId, 1, MAX_INT32)) throw new RangeError('requestId must be a positive int32');
        if(!isIntInRange(action, 0, 4)) throw new RangeError('action must be 0..4');
        if(!isIntInRange(fromSlot, 0, SLOT_COUNT)) throw new RangeError('fromSlot must be 0..10');
        if(!isIntInRange(toSlot, 0, SLOT_COUNT)) throw new RangeError('toSlot must be 0..10');
        if(!isIntInRange(targetUserId, 0, MAX_INT32)) throw new RangeError('targetUserId must be a non-negative int32');

        this._data = [requestId, action, fromSlot, toSlot, targetUserId];
    }

    public getMessageArray(): [number, number, number, number, number]
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
