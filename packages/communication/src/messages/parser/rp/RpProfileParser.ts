import { IMessageDataWrapper, IMessageParser } from '@volt/api';

const TEXT_LENGTH = 64;

const validText = (value: unknown): value is string => typeof value === 'string' && value.length <= TEXT_LENGTH;
const validCount = (value: number): boolean => Number.isInteger(value) && value >= 0;

export class RpProfileParser implements IMessageParser
{
    private _requestId = 0;
    private _userId = 0;
    private _available = false;
    private _gang = '';
    private _job = '';
    private _rank = '';
    private _kills = 0;
    private _deaths = 0;
    private _punchesThrown = 0;
    private _punchesMissed = 0;
    private _punchesReceived = 0;
    private _timesJailed = 0;

    public flush(): boolean
    {
        this._requestId = 0;
        this._userId = 0;
        this._available = false;
        this._gang = '';
        this._job = '';
        this._rank = '';
        this._kills = 0;
        this._deaths = 0;
        this._punchesThrown = 0;
        this._punchesMissed = 0;
        this._punchesReceived = 0;
        this._timesJailed = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper) return false;
        try
        {
            if(this.readCard(wrapper)) return true;
        }
        catch
        {
            // a truncated packet is rejected like any other malformed one
        }
        this.flush();
        return false;
    }

    private readCard(wrapper: IMessageDataWrapper): boolean
    {
        const requestId = wrapper.readInt();
        const userId = wrapper.readInt();
        const available = wrapper.readInt();
        const gang = wrapper.readString();
        const job = wrapper.readString();
        const rank = wrapper.readString();
        const kills = wrapper.readInt();
        const deaths = wrapper.readInt();
        const punchesThrown = wrapper.readInt();
        const punchesMissed = wrapper.readInt();
        const punchesReceived = wrapper.readInt();
        const timesJailed = wrapper.readInt();
        if(wrapper.bytesAvailable) return false;
        if(!Number.isInteger(requestId) || requestId <= 0 || !Number.isInteger(userId) || userId <= 0) return false;
        if(available !== 0 && available !== 1) return false;
        if(![gang, job, rank].every(validText)) return false;
        if(![kills, deaths, punchesThrown, punchesMissed, punchesReceived, timesJailed].every(validCount)) return false;
        if(punchesMissed > punchesThrown) return false;
        this._requestId = requestId;
        this._userId = userId;
        this._available = available === 1;
        this._gang = gang;
        this._job = job;
        this._rank = rank;
        this._kills = kills;
        this._deaths = deaths;
        this._punchesThrown = punchesThrown;
        this._punchesMissed = punchesMissed;
        this._punchesReceived = punchesReceived;
        this._timesJailed = timesJailed;
        return true;
    }

    public get requestId(): number { return this._requestId; }
    public get userId(): number { return this._userId; }
    public get available(): boolean { return this._available; }
    public get gang(): string { return this._gang; }
    public get job(): string { return this._job; }
    public get rank(): string { return this._rank; }
    public get kills(): number { return this._kills; }
    public get deaths(): number { return this._deaths; }
    public get punchesThrown(): number { return this._punchesThrown; }
    public get punchesMissed(): number { return this._punchesMissed; }
    public get punchesReceived(): number { return this._punchesReceived; }
    public get timesJailed(): number { return this._timesJailed; }
}
