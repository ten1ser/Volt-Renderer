import { IMessageComposer } from '@volt/api';

const TOKEN = /^[0-9a-f]{32}$/;

// Yes (1) or No (0) to a staff sale offer.
export class RpPhoneOfferResponseComposer implements IMessageComposer<[string, number]>
{
    private _data: [string, number];

    constructor(offerId: string, accepted: number)
    {
        if(typeof offerId !== 'string' || !TOKEN.test(offerId)) throw new RangeError('offerId must be a 32-character hexadecimal token');
        if(accepted !== 0 && accepted !== 1) throw new RangeError('accepted must be 0 or 1');

        this._data = [offerId, accepted];
    }

    public getMessageArray(): [string, number]
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
