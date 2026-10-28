import { IMessageDataWrapper, IMessageParser } from '@volt/api';

const TOKEN = /^[0-9a-f]{32}$/;
const NAME_LENGTH = 64;

// 6102: a staff sale offer (state 1) or its close (state 0).
export class RpPhoneOfferParser implements IMessageParser
{
    private _state = 0;
    private _offerId = '';
    private _item = '';
    private _amount = 0;
    private _price = 0;
    private _seller = '';
    private _expiresInMs = 0;

    public flush(): boolean
    {
        this._state = 0;
        this._offerId = '';
        this._item = '';
        this._amount = 0;
        this._price = 0;
        this._seller = '';
        this._expiresInMs = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper) return false;
        try
        {
            if(this.readOffer(wrapper)) return true;
        }
        catch
        {
            // a truncated packet is rejected like any other malformed one
        }
        this.flush();
        return false;
    }

    private readOffer(wrapper: IMessageDataWrapper): boolean
    {
        const state = wrapper.readInt();
        const offerId = wrapper.readString();
        const item = wrapper.readString();
        const amount = wrapper.readInt();
        const price = wrapper.readInt();
        const seller = wrapper.readString();
        const expiresInMs = wrapper.readInt();
        if(wrapper.bytesAvailable) return false;
        if((state !== 0 && state !== 1) || typeof offerId !== 'string' || !TOKEN.test(offerId)) return false;
        if(item !== 'sim' && item !== 'load') return false;
        if(![amount, price, expiresInMs].every(value => Number.isInteger(value) && value >= 0)) return false;
        if(typeof seller !== 'string' || seller.length > NAME_LENGTH) return false;
        if(state === 1 && (price <= 0 || expiresInMs <= 0 || seller === '')) return false;
        this._state = state;
        this._offerId = offerId;
        this._item = item;
        this._amount = amount;
        this._price = price;
        this._seller = seller;
        this._expiresInMs = expiresInMs;
        return true;
    }

    public get state(): number { return this._state; }
    public get offerId(): string { return this._offerId; }
    public get item(): string { return this._item; }
    public get amount(): number { return this._amount; }
    public get price(): number { return this._price; }
    public get seller(): string { return this._seller; }
    public get expiresInMs(): number { return this._expiresInMs; }
}
