import { IMessageComposer } from '@volt/api';

const TOKEN = /^[0-9a-f]{32}$/;

export class RpHealResponseComposer implements IMessageComposer<[string, number]>
{
    constructor(private offerId: string, private accepted: number)
    {
        if(typeof offerId !== 'string' || !TOKEN.test(offerId))
            throw new Error('Heal offer response requires a 32-character hexadecimal offer token.');
        if(accepted !== 0 && accepted !== 1)
            throw new Error('Heal offer response decision must be 0 or 1.');
    }

    public getMessageArray(): [string, number]
    { return [this.offerId, this.accepted]; }

    public dispose(): void { }
}
