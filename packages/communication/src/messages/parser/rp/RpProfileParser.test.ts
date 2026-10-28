import { IMessageDataWrapper } from '@volt/api';
import { describe, expect, it } from 'vitest';
import { VoltMessages } from '../../../VoltMessages';
import { IncomingHeader } from '../../incoming/IncomingHeader';
import { RpProfileEvent } from '../../incoming/rp';
import { OutgoingHeader } from '../../outgoing/OutgoingHeader';
import { RpProfileRequestComposer } from '../../outgoing/rp';
import { RpProfileParser } from './RpProfileParser';

type Card = [number, number, number, string, string, string, number, number, number, number, number, number];

const CARD: Card = [7, 5, 1, 'Southside Kings', 'Hospital', 'Trainee', 12, 4, 248, 61, 190, 2];

const wrapper = (values: (number | string)[], extra = false) =>
{
    let index = 0;
    const next = () => values[index++];
    return { readInt: next, readString: next, bytesAvailable: extra } as unknown as IMessageDataWrapper;
};

const withField = (index: number, value: number | string): Card =>
{
    const card = [...CARD] as Card;
    card[index] = value;
    return card;
};

describe('Profile protocol', () =>
{
    it('reads a card in wire order and registers both directions', () =>
    {
        const parser = new RpProfileParser();
        expect(parser.parse(wrapper(CARD))).toBe(true);
        expect([parser.requestId, parser.userId, parser.available, parser.gang, parser.job, parser.rank]).toEqual([7, 5, true, 'Southside Kings', 'Hospital', 'Trainee']);
        expect([parser.kills, parser.deaths, parser.punchesThrown, parser.punchesMissed, parser.punchesReceived, parser.timesJailed]).toEqual([12, 4, 248, 61, 190, 2]);

        const messages = new VoltMessages();
        expect(IncomingHeader.RP_PROFILE).toBe(6090);
        expect(OutgoingHeader.RP_PROFILE_REQUEST).toBe(6090);
        expect(messages.events.get(6090)).toBe(RpProfileEvent);
        expect(messages.composers.get(6090)).toBe(RpProfileRequestComposer);
    });

    it('rejects malformed cards and resets to defaults', () =>
    {
        const parser = new RpProfileParser();
        expect(parser.parse(wrapper(CARD, true))).toBe(false);
        expect([parser.requestId, parser.available, parser.job, parser.kills]).toEqual([0, false, '', 0]);
        expect(parser.parse(wrapper(withField(0, 0)))).toBe(false);
        expect(parser.parse(wrapper(withField(2, 2)))).toBe(false);
        expect(parser.parse(wrapper(withField(4, 'x'.repeat(65))))).toBe(false);
        expect(parser.parse(wrapper(withField(6, -1)))).toBe(false);
        expect(parser.parse(wrapper(withField(9, 249)))).toBe(false);
        expect(parser.parse({ readInt: () => { throw new Error('truncated'); } } as unknown as IMessageDataWrapper)).toBe(false);
    });

    it('serializes requests and rejects invalid arguments', () =>
    {
        expect(new RpProfileRequestComposer(7, 5).getMessageArray()).toEqual([7, 5]);
        expect(() => new RpProfileRequestComposer(0, 5)).toThrow();
        expect(() => new RpProfileRequestComposer(7, 0)).toThrow();
        expect(() => new RpProfileRequestComposer(7, 1.5)).toThrow();
    });
});
