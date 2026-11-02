import { IMessageDataWrapper, IMessageParser } from '@volt/api';

const LABEL_LENGTH = 40;
const NAME_LENGTH = 40;
const RANK_LENGTH = 40;
const TEXT_LENGTH = 120;
const PUBLIC_MIN = 1001;
const PUBLIC_MAX = 9999;

const isChannel = (value: number): boolean => value === 0 || value === 1 || value === 2;
const isFrequency = (channel: number, value: number): boolean =>
    channel === 0 ? value >= PUBLIC_MIN && value <= PUBLIC_MAX : value === 0;

// 6121: a real transmission from the server. Identity, channel and rank come from the server, never the client.
export class RpRadioTransmissionParser implements IMessageParser
{
    private _channel = 0;
    private _frequency = PUBLIC_MIN;
    private _channelLabel = '';
    private _senderId = 0;
    private _senderName = '';
    private _senderRank = '';
    private _text = '';
    private _sentAt = 0;

    public flush(): boolean
    {
        this._channel = 0;
        this._frequency = PUBLIC_MIN;
        this._channelLabel = '';
        this._senderId = 0;
        this._senderName = '';
        this._senderRank = '';
        this._text = '';
        this._sentAt = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper) return false;
        try
        {
            if(this.readTransmission(wrapper)) return true;
        }
        catch
        {
            // a truncated packet is rejected like any other malformed one
        }
        this.flush();
        return false;
    }
    private readTransmission(wrapper: IMessageDataWrapper): boolean
    {
        const channel = wrapper.readInt();
        const frequency = wrapper.readInt();
        const channelLabel = wrapper.readString();
        const senderId = wrapper.readInt();
        const senderName = wrapper.readString();
        const senderRank = wrapper.readString();
        const text = wrapper.readString();
        const sentAt = wrapper.readInt();
        if(wrapper.bytesAvailable) return false;
        if(!isChannel(channel) || !isFrequency(channel, frequency)) return false;
        if(!Number.isInteger(senderId) || senderId < 1) return false;
        if(!Number.isInteger(sentAt) || sentAt < 1) return false;
        if(typeof channelLabel !== 'string' || channelLabel.length > LABEL_LENGTH) return false;
        if(typeof senderName !== 'string' || senderName.length < 1 || senderName.length > NAME_LENGTH) return false;
        if(typeof senderRank !== 'string' || senderRank.length > RANK_LENGTH) return false;
        if(typeof text !== 'string' || text.length < 1 || text.length > TEXT_LENGTH) return false;
        this._channel = channel;
        this._frequency = frequency;
        this._channelLabel = channelLabel;
        this._senderId = senderId;
        this._senderName = senderName;
        this._senderRank = senderRank;
        this._text = text;
        this._sentAt = sentAt;
        return true;
    }

    public get channel(): number { return this._channel; }
    public get frequency(): number { return this._frequency; }
    public get channelLabel(): string { return this._channelLabel; }
    public get senderId(): number { return this._senderId; }
    public get senderName(): string { return this._senderName; }
    public get senderRank(): string { return this._senderRank; }
    public get text(): string { return this._text; }
    public get sentAt(): number { return this._sentAt; }
}