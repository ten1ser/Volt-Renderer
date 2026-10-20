import { IMessageDataWrapper, IMessageParser } from '@volt/api';

const TOKEN = /^[0-9a-f]{32}$/;
const NAME_LENGTH = 25;
const PRICE = 5;
const MAX_OFFER_EXPIRY_MS = 30000;

export class RpHealOfferParser implements IMessageParser
{
    private _state = 0;
    private _offerId = '';
    private _healerName = '';
    private _price = 0;
    private _expiresInMs = 0;

    public flush(): boolean
    {
        this._state = 0;
        this._offerId = '';
        this._healerName = '';
        this._price = 0;
        this._expiresInMs = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper) return false;
        try
        {
            const state = wrapper.readInt();
            const offerId = wrapper.readString();
            const healerName = wrapper.readString();
            const price = wrapper.readInt();
            const expiresInMs = wrapper.readInt();
            if(![state, price, expiresInMs].every(Number.isInteger)) return false;
            if(state !== 0 && state !== 1) return false;
            if(typeof offerId !== 'string' || !TOKEN.test(offerId)) return false;
            if(typeof healerName !== 'string' || healerName.length > NAME_LENGTH) return false;
            if(price !== PRICE) return false;
            if(state === 1)
            {
                if(!healerName.trim()) return false;
                if(expiresInMs < 1 || expiresInMs > MAX_OFFER_EXPIRY_MS) return false;
            }
            else if(expiresInMs !== 0) return false;
            if(wrapper.bytesAvailable) return false;
            this._state = state;
            this._offerId = offerId;
            this._healerName = healerName;
            this._price = price;
            this._expiresInMs = expiresInMs;
            return true;
        }
        catch
        {
            return false;
        }
    }

    public get state(): number { return this._state; }
    public get offerId(): string { return this._offerId; }
    public get healerName(): string { return this._healerName; }
    public get price(): number { return this._price; }
    public get expiresInMs(): number { return this._expiresInMs; }
}
