import { IMessageDataWrapper, IMessageParser } from '@volt/api';

const MESSAGE_LENGTH = 200;
const NUMBER = /^(\+\d{2}-\d{3}-\d)?$/;
const SHORT_CODE = /^\d{2,5}$/;

const count = (value: number): boolean => Number.isInteger(value) && value >= 0;

// 6100: phone status. requestId 0 is a push after a purchase.
export class RpPhoneStatusParser implements IMessageParser
{
    private _requestId = 0;
    private _refused = false;
    private _message = '';
    private _hasSim = false;
    private _number = '';
    private _load = 0;
    private _hospitalNumber = '';
    private _policeNumber = '';
    private _messageCost = 0;
    private _callCost = 0;
    private _callPeriodSeconds = 0;
    private _shareLocation = false;

    public flush(): boolean
    {
        this._requestId = 0;
        this._refused = false;
        this._message = '';
        this._hasSim = false;
        this._number = '';
        this._load = 0;
        this._hospitalNumber = '';
        this._policeNumber = '';
        this._messageCost = 0;
        this._callCost = 0;
        this._callPeriodSeconds = 0;
        this._shareLocation = false;
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
        const message = wrapper.readString();
        const hasSim = wrapper.readInt();
        const number = wrapper.readString();
        const load = wrapper.readInt();
        const hospitalNumber = wrapper.readString();
        const policeNumber = wrapper.readString();
        const messageCost = wrapper.readInt();
        const callCost = wrapper.readInt();
        const callPeriodSeconds = wrapper.readInt();
        const shareLocation = wrapper.readInt();
        if(wrapper.bytesAvailable) return false;
        if(shareLocation !== 0 && shareLocation !== 1) return false;
        if(![requestId, load, messageCost, callCost].every(count) || !Number.isInteger(callPeriodSeconds) || callPeriodSeconds <= 0) return false;
        if((result !== 0 && result !== 1) || (hasSim !== 0 && hasSim !== 1)) return false;
        if(typeof message !== 'string' || message.length > MESSAGE_LENGTH) return false;
        if(typeof number !== 'string' || !NUMBER.test(number) || (hasSim === 1) !== (number.length > 0)) return false;
        if(![hospitalNumber, policeNumber].every(code => typeof code === 'string' && SHORT_CODE.test(code))) return false;
        this._requestId = requestId;
        this._refused = result === 1;
        this._message = message;
        this._hasSim = hasSim === 1;
        this._number = number;
        this._load = load;
        this._hospitalNumber = hospitalNumber;
        this._policeNumber = policeNumber;
        this._messageCost = messageCost;
        this._callCost = callCost;
        this._callPeriodSeconds = callPeriodSeconds;
        this._shareLocation = shareLocation === 1;
        return true;
    }

    public get requestId(): number { return this._requestId; }
    public get refused(): boolean { return this._refused; }
    public get message(): string { return this._message; }
    public get hasSim(): boolean { return this._hasSim; }
    public get number(): string { return this._number; }
    public get load(): number { return this._load; }
    public get hospitalNumber(): string { return this._hospitalNumber; }
    public get policeNumber(): string { return this._policeNumber; }
    public get messageCost(): number { return this._messageCost; }
    public get callCost(): number { return this._callCost; }
    public get callPeriodSeconds(): number { return this._callPeriodSeconds; }
    public get shareLocation(): boolean { return this._shareLocation; }
}
