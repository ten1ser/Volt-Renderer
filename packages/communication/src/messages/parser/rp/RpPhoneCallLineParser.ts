import { IMessageDataWrapper, IMessageParser } from '@volt/api';

const CALL_ID = /^[0-9a-f]{32}$/;
const NAME_LENGTH = 64;
const TEXT_LENGTH = 200;

// 6103: one line said in a connected call.
export class RpPhoneCallLineParser implements IMessageParser
{
    private _callId = '';
    private _fromSelf = false;
    private _speaker = '';
    private _text = '';

    public flush(): boolean
    {
        this._callId = '';
        this._fromSelf = false;
        this._speaker = '';
        this._text = '';
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper) return false;
        try
        {
            if(this.readLine(wrapper)) return true;
        }
        catch
        {
            // a truncated packet is rejected like any other malformed one
        }
        this.flush();
        return false;
    }

    private readLine(wrapper: IMessageDataWrapper): boolean
    {
        const callId = wrapper.readString();
        const fromSelf = wrapper.readInt();
        const speaker = wrapper.readString();
        const text = wrapper.readString();
        if(wrapper.bytesAvailable) return false;
        if(typeof callId !== 'string' || !CALL_ID.test(callId) || (fromSelf !== 0 && fromSelf !== 1)) return false;
        if(typeof speaker !== 'string' || speaker.length === 0 || speaker.length > NAME_LENGTH) return false;
        if(typeof text !== 'string' || text.length === 0 || text.length > TEXT_LENGTH) return false;
        this._callId = callId;
        this._fromSelf = fromSelf === 1;
        this._speaker = speaker;
        this._text = text;
        return true;
    }

    public get callId(): string { return this._callId; }
    public get fromSelf(): boolean { return this._fromSelf; }
    public get speaker(): string { return this._speaker; }
    public get text(): string { return this._text; }
}
