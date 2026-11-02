import { IMessageComposer } from '@volt/api';

const MAX_INT32 = 2147483647;
const PUBLIC_MIN = 1001;
const PUBLIC_MAX = 9999;
const MAX_TEXT = 120;

// action: 0 read status, 1 power (channel 0 off / 1 on), 2 tune, 3 transmit.
// frequency is public tenths (1001..9999); private channels and power/read use 0.
export class RpRadioRequestComposer implements IMessageComposer<[number, number, number, number, string]>
{
    private _data: [number, number, number, number, string];

    constructor(requestId: number, action: number, channel: number, frequency: number, text: string)
    {
        if(!Number.isInteger(requestId) || requestId < 1 || requestId > MAX_INT32) throw new RangeError('requestId must be a positive int32');
        if(!Number.isInteger(action) || action < 0 || action > 3) throw new RangeError('action must be 0..3');
        if(!Number.isInteger(channel) || channel < 0 || channel > 2) throw new RangeError('channel must be 0..2');
        if(!Number.isInteger(frequency) || frequency < 0 || frequency > PUBLIC_MAX) throw new RangeError('frequency must be 0 or 1001..9999');
        if(frequency !== 0 && (frequency < PUBLIC_MIN || frequency > PUBLIC_MAX)) throw new RangeError('frequency must be 0 or 1001..9999');
        if(typeof text !== 'string' || text.length > MAX_TEXT) throw new RangeError('text must be at most 120 characters');
        if(action !== 3 && text.length > 0) throw new RangeError('only a transmission carries text');
        if((action === 2 || action === 3) && channel === 0 && frequency === 0) throw new RangeError('a public tune or transmission needs a frequency');
        if((action === 2 || action === 3) && channel !== 0 && frequency !== 0) throw new RangeError('a private channel has no frequency');

        this._data = [requestId, action, channel, frequency, text];
    }

    public getMessageArray(): [number, number, number, number, string]
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}