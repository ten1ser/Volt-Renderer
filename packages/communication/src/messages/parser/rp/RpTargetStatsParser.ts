import { IMessageDataWrapper, IMessageParser } from '@volt/api';

const MAX_INT32 = 2147483647;
const PAYLOAD_BYTES = 24;

const isPositiveInt32 = (value: number): boolean => Number.isInteger(value) && value > 0 && value <= MAX_INT32;
const isStat = (value: number): boolean => Number.isInteger(value) && value >= 0 && value <= 100;

export class RpTargetStatsParser implements IMessageParser
{
    private _requestId = 0;
    private _roomId = 0;
    private _targetUserId = 0;
    private _available = false;
    private _health = 0;
    private _energy = 0;

    public flush(): boolean
    {
        this._requestId = 0;
        this._roomId = 0;
        this._targetUserId = 0;
        this._available = false;
        this._health = 0;
        this._energy = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper || (wrapper.remainingBytes !== undefined && wrapper.remainingBytes !== PAYLOAD_BYTES)) return false;
        try
        {
            const requestId = wrapper.readInt();
            const roomId = wrapper.readInt();
            const targetUserId = wrapper.readInt();
            const available = wrapper.readInt();
            const health = wrapper.readInt();
            const energy = wrapper.readInt();
            if(wrapper.bytesAvailable) return false;

            if(!isPositiveInt32(requestId) || !isPositiveInt32(roomId) || !isPositiveInt32(targetUserId)) return false;
            if(available !== 0 && available !== 1) return false;
            if(!isStat(health) || !isStat(energy)) return false;
            if(available === 0 && (health !== 0 || energy !== 0)) return false;

            this._requestId = requestId;
            this._roomId = roomId;
            this._targetUserId = targetUserId;
            this._available = available === 1;
            this._health = health;
            this._energy = energy;
            return true;
        }
        catch
        {
            return false;
        }
    }

    public get requestId(): number
    {
        return this._requestId;
    }
    public get roomId(): number
    {
        return this._roomId;
    }
    public get targetUserId(): number
    {
        return this._targetUserId;
    }
    public get available(): boolean
    {
        return this._available;
    }
    public get health(): number
    {
        return this._health;
    }
    public get energy(): number
    {
        return this._energy;
    }
}
