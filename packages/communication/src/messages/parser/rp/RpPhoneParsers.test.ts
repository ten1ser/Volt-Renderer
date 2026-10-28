import { IMessageDataWrapper } from '@volt/api';
import { describe, expect, it } from 'vitest';
import { VoltMessages } from '../../../VoltMessages';
import { RpPhoneCallEvent, RpPhoneCallLineEvent, RpPhoneHistoryEvent, RpPhoneLocationEvent, RpPhoneOfferEvent, RpPhoneStatusEvent } from '../../incoming/rp';
import { RpPhoneCallActionComposer, RpPhoneOfferResponseComposer, RpPhoneRequestComposer } from '../../outgoing/rp';
import { RpPhoneCallLineParser } from './RpPhoneCallLineParser';
import { RpPhoneCallParser } from './RpPhoneCallParser';
import { RpPhoneHistoryParser } from './RpPhoneHistoryParser';
import { RpPhoneLocationParser } from './RpPhoneLocationParser';
import { RpPhoneOfferParser } from './RpPhoneOfferParser';
import { RpPhoneStatusParser } from './RpPhoneStatusParser';

const CALL = 'a'.repeat(32);
const OFFER = '0123456789abcdef0123456789abcdef';

const wrapper = (values: (number | string)[], extra = false) =>
{
    let index = 0;
    const next = () => values[index++];
    return { readInt: next, readString: next, bytesAvailable: extra } as unknown as IMessageDataWrapper;
};

const STATUS: (number | string)[] = [7, 0, '', 1, '+12-345-6', 25, '112', '911', 1, 1, 30, 1];
const replace = (values: (number | string)[], index: number, value: number | string) => values.map((item, at) => (at === index ? value : item));

describe('Phone protocol', () =>
{
    it('registers all four events and three composers on 6100-6103', () =>
    {
        const messages = new VoltMessages();
        expect([6100, 6101, 6102, 6103].map(id => messages.events.get(id))).toEqual([RpPhoneStatusEvent, RpPhoneCallEvent, RpPhoneOfferEvent, RpPhoneCallLineEvent]);
        expect([6100, 6101, 6102].map(id => messages.composers.get(id))).toEqual([RpPhoneRequestComposer, RpPhoneCallActionComposer, RpPhoneOfferResponseComposer]);
    });

    it('reads the phone status and rejects inconsistent SIM fields', () =>
    {
        const parser = new RpPhoneStatusParser();
        expect(parser.parse(wrapper(STATUS))).toBe(true);
        expect([parser.requestId, parser.refused, parser.hasSim, parser.number, parser.load]).toEqual([7, false, true, '+12-345-6', 25]);
        expect([parser.hospitalNumber, parser.policeNumber, parser.messageCost, parser.callCost, parser.callPeriodSeconds]).toEqual(['112', '911', 1, 1, 30]);
        expect(parser.shareLocation).toBe(true);
        expect(parser.parse(wrapper([0, 1, 'Enter a number like +12-345-6.', 0, '', 0, '112', '911', 1, 1, 30, 0]))).toBe(true);
        expect([parser.refused, parser.hasSim, parser.message]).toEqual([true, false, 'Enter a number like +12-345-6.']);

        expect(parser.parse(wrapper(replace(STATUS, 4, '')))).toBe(false);
        expect(parser.parse(wrapper(replace(STATUS, 4, '123456')))).toBe(false);
        expect(parser.parse(wrapper(replace(STATUS, 5, -1)))).toBe(false);
        expect(parser.parse(wrapper(replace(STATUS, 6, '1a')))).toBe(false);
        expect(parser.parse(wrapper(replace(STATUS, 10, 0)))).toBe(false);
        expect(parser.parse(wrapper(replace(STATUS, 11, 2)))).toBe(false);
        expect(parser.parse(wrapper(STATUS, true))).toBe(false);
        expect([parser.requestId, parser.number]).toEqual([0, '']);
    });

    it('reads call states and lines', () =>
    {
        const call = new RpPhoneCallParser();
        expect(call.parse(wrapper([2, CALL, 'alice', '+12-345-6', 0, '']))).toBe(true);
        expect([call.state, call.callId, call.peerName, call.peerNumber]).toEqual([2, CALL, 'alice', '+12-345-6']);
        expect(call.parse(wrapper([0, '', '', '', 0, 'bob is busy.']))).toBe(true);
        expect([call.state, call.notice]).toEqual([0, 'bob is busy.']);
        expect(call.parse(wrapper([3, '', 'alice', '', 0, '']))).toBe(false);
        expect(call.parse(wrapper([4, CALL, 'alice', '', 0, '']))).toBe(false);

        const line = new RpPhoneCallLineParser();
        expect(line.parse(wrapper([CALL, 1, 'alice', 'meet me at the bank']))).toBe(true);
        expect([line.fromSelf, line.speaker, line.text]).toEqual([true, 'alice', 'meet me at the bank']);
        expect(line.parse(wrapper([CALL, 1, 'alice', '']))).toBe(false);
        expect(line.parse(wrapper(['short', 0, 'alice', 'hi']))).toBe(false);
    });

    it('reads call history and contact locations', () =>
    {
        const history = new RpPhoneHistoryParser();
        expect(history.parse(wrapper([3, 2, 1, 1, 'bob', '+22-333-4', 90, 42, 0, 0, 'carl', '+33-444-5', 600, 0]))).toBe(true);
        expect(history.calls).toEqual([
            { outgoing: true, answered: true, peerName: 'bob', peerNumber: '+22-333-4', agoSeconds: 90, durationSeconds: 42 },
            { outgoing: false, answered: false, peerName: 'carl', peerNumber: '+33-444-5', agoSeconds: 600, durationSeconds: 0 }
        ]);
        expect(history.parse(wrapper([3, 1, 1, 1, 'bob', '123456', 90, 42]))).toBe(false);
        expect(history.parse(wrapper([3, 51]))).toBe(false);

        const location = new RpPhoneLocationParser();
        expect(location.parse(wrapper([5, 2, 1, 'Main Street', '']))).toBe(true);
        expect([location.userId, location.state, location.roomName]).toEqual([2, 1, 'Main Street']);
        expect(location.parse(wrapper([5, 2, 0, '', 'They are not sharing their location.']))).toBe(true);
        expect(location.parse(wrapper([5, 2, 1, '', '']))).toBe(false);
        expect(location.parse(wrapper([5, 2, 4, '', '']))).toBe(false);
        expect(new VoltMessages().events.get(6104)).toBe(RpPhoneHistoryEvent);
        expect(new VoltMessages().events.get(6105)).toBe(RpPhoneLocationEvent);
    });

    it('reads sale offers and their close', () =>
    {
        const parser = new RpPhoneOfferParser();
        expect(parser.parse(wrapper([1, OFFER, 'sim', 20, 50, 'staff', 60000]))).toBe(true);
        expect([parser.state, parser.item, parser.amount, parser.price, parser.seller, parser.expiresInMs]).toEqual([1, 'sim', 20, 50, 'staff', 60000]);
        expect(parser.parse(wrapper([0, OFFER, 'load', 0, 0, '', 0]))).toBe(true);
        expect(parser.parse(wrapper([1, OFFER, 'car', 20, 50, 'staff', 60000]))).toBe(false);
        expect(parser.parse(wrapper([1, OFFER, 'sim', 20, 0, 'staff', 60000]))).toBe(false);
        expect(parser.parse(wrapper([1, 'nope', 'sim', 20, 50, 'staff', 60000]))).toBe(false);
    });

    it('serializes requests and refuses bad arguments', () =>
    {
        expect(new RpPhoneRequestComposer(3, 1, 'RESET').getMessageArray()).toEqual([3, 1, 'RESET']);
        expect(new RpPhoneCallActionComposer(0, '+12-345-6').getMessageArray()).toEqual([0, '+12-345-6']);
        expect(new RpPhoneOfferResponseComposer(OFFER, 1).getMessageArray()).toEqual([OFFER, 1]);
        expect(() => new RpPhoneRequestComposer(0, 0, '')).toThrow();
        expect(new RpPhoneRequestComposer(2, 4, '15').getMessageArray()).toEqual([2, 4, '15']);
        expect(new RpPhoneCallActionComposer(3, '15').getMessageArray()).toEqual([3, '15']);
        expect(() => new RpPhoneRequestComposer(1, 6, '')).toThrow();
        expect(() => new RpPhoneRequestComposer(1, 2, 'x'.repeat(33))).toThrow();
        expect(() => new RpPhoneCallActionComposer(4, '')).toThrow();
        expect(() => new RpPhoneOfferResponseComposer('ABC', 1)).toThrow();
        expect(() => new RpPhoneOfferResponseComposer(OFFER, 2)).toThrow();
    });
});
