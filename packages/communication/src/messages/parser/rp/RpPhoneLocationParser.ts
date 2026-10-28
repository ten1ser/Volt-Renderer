import { IMessageDataWrapper, IMessageParser } from '@volt/api';

const TEXT_LENGTH = 200;

// 6105: where a contact is. state 0 hidden (not sharing or not allowed), 1 in a room, 2 not in a room, 3 offline.
export class RpPhoneLocationParser implements IMessageParser
{
    private _requestId = 0;
    private _userId = 0;
    private _state = 0;
    private _roomName = '';
    private _message = '';

    public flush(): boolean
    {
        this._requestId = 0;
        this._userId = 0;
        this._state = 0;
        this._roomName = '';
        this._message = '';
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper) return false;
        try
        {
            if(this.readLocation(wrapper)) return true;
        }
        catch
        {
            // a truncated packet is rejected like any other malformed one
        }
        this.flush();
        return false;
    }

    private readLocation(wrapper: IMessageDataWrapper): boolean
    {
        const requestId = wrapper.readInt();
        const userId = wrapper.readInt();
        const state = wrapper.readInt();
        const roomName = wrapper.readString();
        const message = wrapper.readString();
        if(wrapper.bytesAvailable) return false;
        if(!Number.isInteger(requestId) || requestId <= 0 || !Number.isInteger(userId) || userId <= 0) return false;
        if(!Number.isInteger(state) || state < 0 || state > 3) return false;
        if(typeof roomName !== 'string' || roomName.length > TEXT_LENGTH || (state === 1) !== (roomName.length > 0)) return false;
        if(typeof message !== 'string' || message.length > TEXT_LENGTH) return false;
        this._requestId = requestId;
        this._userId = userId;
        this._state = state;
        this._roomName = roomName;
        this._message = message;
        return true;
    }

    public get requestId(): number { return this._requestId; }
    public get userId(): number { return this._userId; }
    public get state(): number { return this._state; }
    public get roomName(): string { return this._roomName; }
    public get message(): string { return this._message; }
}
