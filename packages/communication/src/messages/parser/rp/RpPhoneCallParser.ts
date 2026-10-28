import { IMessageDataWrapper, IMessageParser } from '@volt/api';

const CALL_ID = /^([0-9a-f]{32})?$/;
const NUMBER = /^(\+\d{2}-\d{3}-\d)?$/;
const NAME_LENGTH = 64;
const NOTICE_LENGTH = 200;

// 6101: call state. 0 idle (with why a call ended or failed), 1 dialing, 2 incoming, 3 connected.
export class RpPhoneCallParser implements IMessageParser
{
    private _state = 0;
    private _callId = '';
    private _peerName = '';
    private _peerNumber = '';
    private _seconds = 0;
    private _notice = '';

    public flush(): boolean
    {
        this._state = 0;
        this._callId = '';
        this._peerName = '';
        this._peerNumber = '';
        this._seconds = 0;
        this._notice = '';
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper) return false;
        try
        {
            if(this.readCall(wrapper)) return true;
        }
        catch
        {
            // a truncated packet is rejected like any other malformed one
        }
        this.flush();
        return false;
    }

    private readCall(wrapper: IMessageDataWrapper): boolean
    {
        const state = wrapper.readInt();
        const callId = wrapper.readString();
        const peerName = wrapper.readString();
        const peerNumber = wrapper.readString();
        const seconds = wrapper.readInt();
        const notice = wrapper.readString();
        if(wrapper.bytesAvailable) return false;
        if(!Number.isInteger(state) || state < 0 || state > 3 || !Number.isInteger(seconds) || seconds < 0) return false;
        if(typeof callId !== 'string' || !CALL_ID.test(callId) || (state !== 0 && callId === '')) return false;
        if(typeof peerName !== 'string' || peerName.length > NAME_LENGTH) return false;
        if(typeof peerNumber !== 'string' || !NUMBER.test(peerNumber)) return false;
        if(typeof notice !== 'string' || notice.length > NOTICE_LENGTH) return false;
        this._state = state;
        this._callId = callId;
        this._peerName = peerName;
        this._peerNumber = peerNumber;
        this._seconds = seconds;
        this._notice = notice;
        return true;
    }

    public get state(): number { return this._state; }
    public get callId(): string { return this._callId; }
    public get peerName(): string { return this._peerName; }
    public get peerNumber(): string { return this._peerNumber; }
    public get seconds(): number { return this._seconds; }
    public get notice(): string { return this._notice; }
}
