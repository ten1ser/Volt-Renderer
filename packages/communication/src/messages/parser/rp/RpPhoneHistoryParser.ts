import { IMessageDataWrapper, IMessageParser } from '@volt/api';

const MAX_CALLS = 50;
const NAME_LENGTH = 64;
const NUMBER = /^\+\d{2}-\d{3}-\d$/;

export interface RpPhoneCallRecord
{
    outgoing: boolean;
    answered: boolean;
    peerName: string;
    peerNumber: string;
    agoSeconds: number;
    durationSeconds: number;
}

const validRow = ([outgoing, answered, peerName, peerNumber, agoSeconds, durationSeconds]: [number, number, string, string, number, number]): boolean =>
    (outgoing === 0 || outgoing === 1) && (answered === 0 || answered === 1)
    && typeof peerName === 'string' && peerName.length <= NAME_LENGTH && typeof peerNumber === 'string' && NUMBER.test(peerNumber)
    && [agoSeconds, durationSeconds].every(value => Number.isInteger(value) && value >= 0);

// 6104: the player's recent calls, newest first.
export class RpPhoneHistoryParser implements IMessageParser
{
    private _requestId = 0;
    private _calls: RpPhoneCallRecord[] = [];

    public flush(): boolean
    {
        this._requestId = 0;
        this._calls = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper) return false;
        try
        {
            if(this.readHistory(wrapper)) return true;
        }
        catch
        {
            // a truncated packet is rejected like any other malformed one
        }
        this.flush();
        return false;
    }

    // Flat so the packet contract checker can follow the counted list.
    private readHistory(wrapper: IMessageDataWrapper): boolean
    {
        const requestId = wrapper.readInt();
        const count = wrapper.readInt();
        if(!Number.isInteger(count) || count < 0 || count > MAX_CALLS) return false;
        const rows: [number, number, string, string, number, number][] = [];
        for(let index = 0; index < count; index++)
        {
            const outgoing = wrapper.readInt();
            const answered = wrapper.readInt();
            const peerName = wrapper.readString();
            const peerNumber = wrapper.readString();
            const agoSeconds = wrapper.readInt();
            const durationSeconds = wrapper.readInt();
            rows.push([outgoing, answered, peerName, peerNumber, agoSeconds, durationSeconds]);
        }
        if(wrapper.bytesAvailable) return false;
        if(!Number.isInteger(requestId) || requestId <= 0 || !rows.every(validRow)) return false;
        this._requestId = requestId;
        this._calls = rows.map(([outgoing, answered, peerName, peerNumber, agoSeconds, durationSeconds]) =>
            ({ outgoing: outgoing === 1, answered: answered === 1, peerName, peerNumber, agoSeconds, durationSeconds }));
        return true;
    }

    public get requestId(): number { return this._requestId; }
    public get calls(): readonly RpPhoneCallRecord[] { return this._calls; }
}
