import { IMessageDataWrapper, IMessageParser } from '@volt/api';

export class RpStatsParser implements IMessageParser
{
    private _health = 0;
    private _energy = 0;

    public flush(): boolean
    {
        this._health = 0;
        this._energy = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper || (wrapper.remainingBytes !== undefined && wrapper.remainingBytes !== 8)) return false;
        try
        {
            const health = wrapper.readInt();
            const energy = wrapper.readInt();
            if(!Number.isInteger(health) || !Number.isInteger(energy) || health < 0 || health > 100 || energy < 0 || energy > 100 || wrapper.bytesAvailable) return false;
            this._health = health;
            this._energy = energy;
            return true;
        }
        catch
        {
            return false;
        }
    }

    public get health(): number { return this._health; }
    public get energy(): number { return this._energy; }
}
