import { IMessageDataWrapper } from '@volt/api';
import { describe, expect, it } from 'vitest';
import { VoltMessages } from '../../../VoltMessages';
import { IncomingHeader } from '../../incoming/IncomingHeader';
import { RpHealOfferEvent } from '../../incoming/rp';
import { OutgoingHeader } from '../../outgoing/OutgoingHeader';
import { RpHealResponseComposer } from '../../outgoing/rp';
import { RpHealOfferParser } from './RpHealOfferParser';

const TOKEN = '0123456789abcdef0123456789abcdef';
const fields = (overrides: Partial<{ state: number; offerId: string; name: string; price: number; expires: number }> = {}) => ({
    state: 1, offerId: TOKEN, name: 'teniser', price: 5, expires: 30000, ...overrides
});
const wrapper = (value: ReturnType<typeof fields>, extra = false) =>
{
    const values = [value.state, value.offerId, value.name, value.price, value.expires];
    let index = 0;
    return { readInt: () => values[index++], readString: () => values[index++], bytesAvailable: extra } as unknown as IMessageDataWrapper;
};

describe('Heal offer protocol', () =>
{
    it('reads the fields in wire order and registers both directions', () =>
    {
        const parser = new RpHealOfferParser();
        expect(parser.parse(wrapper(fields()))).toBe(true);
        expect(parser.state).toBe(1);
        expect(parser.offerId).toBe(TOKEN);
        expect(parser.healerName).toBe('teniser');
        expect(parser.price).toBe(5);
        expect(parser.expiresInMs).toBe(30000);

        const messages = new VoltMessages();
        expect(IncomingHeader.RP_HEAL_OFFER).toBe(6071);
        expect(OutgoingHeader.RP_HEAL_RESPONSE).toBe(6071);
        expect(messages.events.get(6071)).toBe(RpHealOfferEvent);
        expect(messages.composers.get(6071)).toBe(RpHealResponseComposer);
    });

    it('accepts a close with no healer name and resets fields on flush', () =>
    {
        const parser = new RpHealOfferParser();
        expect(parser.parse(wrapper(fields({ state: 0, name: '', expires: 0 })))).toBe(true);
        expect([parser.state, parser.healerName, parser.expiresInMs, parser.price]).toEqual([0, '', 0, 5]);
        expect(parser.flush()).toBe(true);
        expect([parser.state, parser.offerId, parser.healerName, parser.price, parser.expiresInMs]).toEqual([0, '', '', 0, 0]);
    });

    it('rejects truncated wrappers, extra bytes and invalid state or price', () =>
    {
        expect(new RpHealOfferParser().parse({ readInt: () => { throw new Error('truncated'); } } as unknown as IMessageDataWrapper)).toBe(false);
        expect(new RpHealOfferParser().parse(wrapper(fields(), true))).toBe(false);
        expect(new RpHealOfferParser().parse(wrapper(fields({ state: 2 })))).toBe(false);
        expect(new RpHealOfferParser().parse(wrapper(fields({ state: -1 })))).toBe(false);
        expect(new RpHealOfferParser().parse(wrapper(fields({ price: 4 })))).toBe(false);
        expect(new RpHealOfferParser().parse(wrapper(fields({ price: 6 })))).toBe(false);
    });

    it('rejects invalid tokens, names and expiries without keeping stale values', () =>
    {
        const parser = new RpHealOfferParser();
        expect(parser.parse(wrapper(fields()))).toBe(true);
        expect(parser.parse(wrapper(fields({ offerId: 'abc' })))).toBe(false);
        expect(parser.offerId).toBe('');
        expect(parser.parse(wrapper(fields({ offerId: 'g'.repeat(32) })))).toBe(false);
        expect(parser.parse(wrapper(fields({ offerId: TOKEN.toUpperCase() })))).toBe(false);
        expect(parser.parse(wrapper(fields({ name: '' })))).toBe(false);
        expect(parser.parse(wrapper(fields({ name: 'a'.repeat(26) })))).toBe(false);
        expect(parser.parse(wrapper(fields({ expires: 0 })))).toBe(false);
        expect(parser.parse(wrapper(fields({ expires: 30001 })))).toBe(false);
        expect(parser.parse(wrapper(fields({ state: 0, expires: 1 })))).toBe(false);
        expect(parser.state).toBe(0);
        expect(parser.healerName).toBe('');
        expect(parser.price).toBe(0);
        expect(parser.expiresInMs).toBe(0);
    });

    it('serializes accept and decline payloads and rejects invalid constructor arguments', () =>
    {
        expect(new RpHealResponseComposer(TOKEN, 1).getMessageArray()).toEqual([TOKEN, 1]);
        expect(new RpHealResponseComposer(TOKEN, 0).getMessageArray()).toEqual([TOKEN, 0]);
        expect(() => new RpHealResponseComposer('short', 1)).toThrow();
        expect(() => new RpHealResponseComposer(`${ TOKEN }f`, 1)).toThrow();
        expect(() => new RpHealResponseComposer(TOKEN, 2)).toThrow();
        expect(() => new RpHealResponseComposer(TOKEN, -1)).toThrow();
    });
});
