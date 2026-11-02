import { IMessageDataWrapper, IMessageParser } from '@volt/api';

const NOTICE_LENGTH = 200;
const LABEL_LENGTH = 40;
const PUBLIC_MIN = 1001;
const PUBLIC_MAX = 9999;

const isFlag = (value: number): boolean => value === 0 || value === 1;
const isChannel = (value: number): boolean => value === 0 || value === 1 || value === 2;
const isFrequency = (channel: number, value: number): boolean =>
    channel === 0 ? value >= PUBLIC_MIN && value <= PUBLIC_MAX : value === 0;

// 6120: radio status. requestId 0 is a server push; the flags are the only access the client trusts.
export class RpRadioStatusParser implements IMessageParser
{
    private _requestId = 0;
    private _refused = false;
    private _notice = '';
    private _powered = false;
    private _channel = 0;
    private _frequency = PUBLIC_MIN;
    private _channelLabel = '';
    private _hospitalAccess = false;
    private _gangAccess = false;

    public flush(): boolean
    {
        this._requestId = 0;
        this._refused = false;
        this._notice = '';
        this._powered = false;
        this._channel = 0;
        this._frequency = PUBLIC_MIN;
        this._channelLabel = '';
        this._hospitalAccess = false;
        this._gangAccess = false;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper) return false;
        try
        {
            if(this.readStatus(wrapper)) return true;
        }
        catch
        {
            // a truncated packet is rejected like any other malformed one
        }
        this.flush();
        return false;
    }
    private readStatus(wrapper: IMessageDataWrapper): boolean
    {
        const requestId = wrapper.readInt();
        const result = wrapper.readInt();
        const notice = wrapper.readString();
        const powered = wrapper.readInt();
        const channel = wrapper.readInt();
        const frequency = wrapper.readInt();
        const channelLabel = wrapper.readString();
        const hospitalAccess = wrapper.readInt();
        const gangAccess = wrapper.readInt();
        if(wrapper.bytesAvailable) return false;
        if(!Number.isInteger(requestId) || requestId < 0) return false;
        if(!isFlag(result) || !isFlag(powered) || !isChannel(channel)) return false;
        if(!isFlag(hospitalAccess) || !isFlag(gangAccess)) return false;
        if(typeof notice !== 'string' || notice.length > NOTICE_LENGTH) return false;
        if(typeof channelLabel !== 'string' || channelLabel.length > LABEL_LENGTH) return false;
        if(!isFrequency(channel, frequency)) return false;
        this._requestId = requestId;
        this._refused = result === 1;
        this._notice = notice;
        this._powered = powered === 1;
        this._channel = channel;
        this._frequency = frequency;
        this._channelLabel = channelLabel;
        this._hospitalAccess = hospitalAccess === 1;
        this._gangAccess = gangAccess === 1;
        return true;
    }

    public get requestId(): number { return this._requestId; }
    public get refused(): boolean { return this._refused; }
    public get notice(): string { return this._notice; }
    public get powered(): boolean { return this._powered; }
    public get channel(): number { return this._channel; }
    public get frequency(): number { return this._frequency; }
    public get channelLabel(): string { return this._channelLabel; }
    public get hospitalAccess(): boolean { return this._hospitalAccess; }
    public get gangAccess(): boolean { return this._gangAccess; }
}