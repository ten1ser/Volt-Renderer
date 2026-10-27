import { IMessageDataWrapper, IMessageParser } from '@volt/api';

export interface RpInventorySlot
{
    slot: number;
    key: string;
    name: string;
    kind: number;
    quantity: number;
    durability: number;
    maxDurability: number;
}

const SLOT_COUNT = 10;
const MESSAGE_LENGTH = 200;
const KEY = /^[a-z0-9_]{0,32}$/;
const NAME_LENGTH = 40;
const MAX_DURABILITY = 1000;

const validSlot = (slot: RpInventorySlot): boolean =>
    [slot.kind, slot.quantity, slot.durability, slot.maxDurability].every(Number.isInteger)
    && typeof slot.key === 'string' && KEY.test(slot.key)
    && typeof slot.name === 'string' && slot.name.length <= NAME_LENGTH
    && slot.kind >= 0 && slot.kind <= 3
    && (slot.key === '' ? slot.kind === 0 && slot.quantity === 0 : slot.kind !== 0 && slot.quantity >= 1)
    && slot.durability >= 0 && slot.maxDurability >= 0 && slot.maxDurability <= MAX_DURABILITY && slot.durability <= slot.maxDurability;

export class RpInventoryParser implements IMessageParser
{
    private _requestId = 0;
    private _result = 0;
    private _message = '';
    private _slots: RpInventorySlot[] = [];

    public flush(): boolean
    {
        this._requestId = 0;
        this._result = 0;
        this._message = '';
        this._slots = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper) return false;
        try
        {
            if(this.readSnapshot(wrapper)) return true;
        }
        catch
        {
            // a truncated packet is rejected like any other malformed one
        }
        this.flush();
        return false;
    }

    // Flat so the packet contract checker can follow the counted slot list.
    private readSnapshot(wrapper: IMessageDataWrapper): boolean
    {
        const requestId = wrapper.readInt();
        const result = wrapper.readInt();
        const message = wrapper.readString();
        const count = wrapper.readInt();
        if(count !== SLOT_COUNT) return false;
        const slots: RpInventorySlot[] = [];
        for(let index = 0; index < count; index++)
        {
            const key = wrapper.readString();
            const name = wrapper.readString();
            const kind = wrapper.readInt();
            const quantity = wrapper.readInt();
            const durability = wrapper.readInt();
            const maxDurability = wrapper.readInt();
            slots.push({ slot: index + 1, key, name, kind, quantity, durability, maxDurability });
        }
        if(wrapper.bytesAvailable) return false;
        if(![requestId, result].every(Number.isInteger) || requestId < 0 || result < 0 || result > 2) return false;
        if(typeof message !== 'string' || message.length > MESSAGE_LENGTH) return false;
        if(!slots.every(validSlot)) return false;
        this._requestId = requestId;
        this._result = result;
        this._message = message;
        this._slots = slots;
        return true;
    }

    public get requestId(): number { return this._requestId; }
    public get result(): number { return this._result; }
    public get message(): string { return this._message; }
    public get slots(): readonly RpInventorySlot[] { return this._slots; }
}
