import { IMessageComposer } from '@volt/api';

export class RpBusinessRequestComposer implements IMessageComposer<[number, number, number, number, number, number, string]>
{
    constructor(private requestId: number, private action = 0, private targetUserId = 0, private level = 0,
        private page = 0, private rankFilter = 0, private search = '') { }
    public getMessageArray(): [number, number, number, number, number, number, string]
    { return [this.requestId, this.action, this.targetUserId, this.level, this.page, this.rankFilter, this.search]; }
    public dispose(): void { }
}
