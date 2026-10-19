import { IMessageDataWrapper, IMessageParser } from '@volt/api';

export class RpHospitalTreatmentParser implements IMessageParser
{
    private _phase = 0;
    private _progress = 0;
    private _remainingMs = 0;

    public flush(): boolean
    {
        this._phase = 0;
        this._progress = 0;
        this._remainingMs = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper || (wrapper.remainingBytes !== undefined && wrapper.remainingBytes !== 12)) return false;
        try
        {
            const phase = wrapper.readInt();
            const progress = wrapper.readInt();
            const remainingMs = wrapper.readInt();
            if(![phase, progress, remainingMs].every(Number.isInteger)) return false;
            if(phase < 0 || phase > 2 || progress < 0 || progress > 100 || remainingMs < 0) return false;
            if(phase === 0 && (progress !== 0 || remainingMs !== 0)) return false;
            if(phase === 1 && progress !== 0) return false;
            if(wrapper.bytesAvailable) return false;
            this._phase = phase;
            this._progress = progress;
            this._remainingMs = remainingMs;
            return true;
        }
        catch
        {
            return false;
        }
    }

    public get phase(): number { return this._phase; }
    public get progress(): number { return this._progress; }
    public get remainingMs(): number { return this._remainingMs; }
}
