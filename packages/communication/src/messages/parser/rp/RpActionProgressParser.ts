import { IMessageDataWrapper, IMessageParser } from '@volt/api';

// 0 pistol reload, 1 pickpocket.
const LAST_KIND = 1;
const MAX_DURATION = 60000;

// 6131: start the own action's progress bar for durationMs, or hide that kind's bar with 0.
export class RpActionProgressParser implements IMessageParser
{
    private _kind = 0;
    private _durationMs = 0;

    public flush(): boolean
    {
        this._kind = 0;
        this._durationMs = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper) return false;
        try
        {
            const kind = wrapper.readInt();
            const durationMs = wrapper.readInt();
            if(!wrapper.bytesAvailable && Number.isInteger(kind) && kind >= 0 && kind <= LAST_KIND &&
                Number.isInteger(durationMs) && durationMs >= 0 && durationMs <= MAX_DURATION)
            {
                this._kind = kind;
                this._durationMs = durationMs;
                return true;
            }
        }
        catch
        {
            // a truncated packet is rejected like any other malformed one
        }
        this.flush();
        return false;
    }

    public get kind(): number { return this._kind; }
    public get durationMs(): number { return this._durationMs; }
}
