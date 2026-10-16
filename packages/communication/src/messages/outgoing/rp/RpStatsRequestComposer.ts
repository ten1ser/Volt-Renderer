import { IMessageComposer } from '@volt/api';

export class RpStatsRequestComposer implements IMessageComposer<[]>
{
    public getMessageArray(): [] { return []; }
    public dispose(): void { }
}
