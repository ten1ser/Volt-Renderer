import { IMessageComposer } from '@volt/api';

const MAX_INT32 = 2147483647;
const VALUE_LENGTH = 400;

// action: 0 read, 1 search, 2 create, 3 request to join, 4 cancel request, 5 accept, 6 decline, 7 kick, 8 set member rank,
// 9 create rank, 10 rename rank, 11 rank manage permission, 12 delete rank, 13 move rank, 14 hand over, 15 leave, 16 disband, 17 edit.
export class RpGangRequestComposer implements IMessageComposer<[number, number, number, number, number, string]>
{
    private _data: [number, number, number, number, number, string];

    constructor(requestId: number, action: number, gangId: number, targetUserId: number, rankId: number, value: string)
    {
        if(!Number.isInteger(requestId) || requestId < 1 || requestId > MAX_INT32) throw new RangeError('requestId must be a positive int32');
        if(!Number.isInteger(action) || action < 0 || action > 17) throw new RangeError('action must be 0..17');
        for(const id of [gangId, targetUserId, rankId]) if(!Number.isInteger(id) || id < 0 || id > MAX_INT32) throw new RangeError('ids must be non-negative int32');
        if(typeof value !== 'string' || value.length > VALUE_LENGTH) throw new RangeError('value must be at most 400 characters');

        this._data = [requestId, action, gangId, targetUserId, rankId, value];
    }

    public getMessageArray(): [number, number, number, number, number, string]
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
