import { IMessageDataWrapper, IMessageParser } from '@volt/api';

export class RpCityParser implements IMessageParser
{
    public cycleElapsedMs = 0;
    public cycleDurationMs = 0;
    public dayDurationMs = 0;
    public onlinePlayers = 0;

    public flush(): boolean
    {
        this.cycleElapsedMs = this.cycleDurationMs = this.dayDurationMs = this.onlinePlayers = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper || (wrapper.remainingBytes !== undefined && wrapper.remainingBytes !== 16)) return false;
        try
        {
            const elapsed = wrapper.readInt();
            const duration = wrapper.readInt();
            const day = wrapper.readInt();
            const online = wrapper.readInt();
            if(![elapsed, duration, day, online].every(Number.isInteger) || duration !== 1800000 || day !== 900000 ||
                elapsed < 0 || elapsed >= duration || online < 0 || wrapper.bytesAvailable) return false;
            this.cycleElapsedMs = elapsed;
            this.cycleDurationMs = duration;
            this.dayDurationMs = day;
            this.onlinePlayers = online;
            return true;
        }
        catch
        {
            return false;
        }
    }
}
