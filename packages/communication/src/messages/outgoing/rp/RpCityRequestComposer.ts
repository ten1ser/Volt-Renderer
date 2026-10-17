import { IMessageComposer } from '@volt/api';

export class RpCityRequestComposer implements IMessageComposer<[]>
{
    public getMessageArray(): [] { return []; }
    public dispose(): void { }
}
