import { IMessageDataWrapper } from '@volt/api';
import { describe, expect, it } from 'vitest';
import { VoltMessages } from '../../../VoltMessages';
import { RpRadioStatusEvent, RpRadioTransmissionEvent } from '../../incoming/rp';
import { RpRadioRequestComposer } from '../../outgoing/rp';
import { RpRadioStatusParser } from './RpRadioStatusParser';
import { RpRadioTransmissionParser } from './RpRadioTransmissionParser';

const wrapper = (values: (number | string)[], extra = false) =>
{
    let index = 0;
    const next = () => values[index++];
    return { readInt: next, readString: next, bytesAvailable: extra } as unknown as IMessageDataWrapper;
};
const replace = (values: (number | string)[], index: number, value: number | string) =>
    values.map((item, at) => (at === index ? value : item));

const STATUS: (number | string)[] = [7, 0, '', 1, 0, 1234, 'Public', 1, 0];
const TRANSMISSION: (number | string)[] = [0, 1234, 'Public', 5, 'alice', '', 'meet at the bank', 1700000000];
describe('Radio protocol', () =>
{
    it('registers both events and the request composer on 6120-6121', () =>
    {
        const messages = new VoltMessages();
        expect([6120, 6121].map(id => messages.events.get(id))).toEqual([RpRadioStatusEvent, RpRadioTransmissionEvent]);
        expect(messages.composers.get(6120)).toBe(RpRadioRequestComposer);
    });

    it('reads the authoritative status and rejects malformed ranges', () =>
    {
        const parser = new RpRadioStatusParser();
        expect(parser.parse(wrapper(STATUS))).toBe(true);
        expect([parser.requestId, parser.refused, parser.notice, parser.powered, parser.channel, parser.frequency]).toEqual([7, false, '', true, 0, 1234]);
        expect([parser.channelLabel, parser.hospitalAccess, parser.gangAccess]).toEqual(['Public', true, false]);

        expect(parser.parse(wrapper([8, 1, 'On duty only.', 0, 1, 0, 'Hospital', 1, 0]))).toBe(true);
        expect([parser.refused, parser.powered, parser.channel, parser.frequency, parser.channelLabel, parser.hospitalAccess])
            .toEqual([true, false, 1, 0, 'Hospital', true]);

        expect(parser.parse(wrapper(replace(STATUS, 0, -1)))).toBe(false);
        expect(parser.parse(wrapper(replace(STATUS, 1, 2)))).toBe(false);
        expect(parser.parse(wrapper(replace(STATUS, 2, 'x'.repeat(201))))).toBe(false);
        expect(parser.parse(wrapper(replace(STATUS, 3, 2)))).toBe(false);
        expect(parser.parse(wrapper(replace(STATUS, 4, 3)))).toBe(false);
        expect(parser.parse(wrapper(replace(STATUS, 5, 1000)))).toBe(false);
        expect(parser.parse(wrapper(replace(replace(STATUS, 4, 1), 5, 1234)))).toBe(false);
        expect(parser.parse(wrapper(replace(STATUS, 6, 'x'.repeat(41))))).toBe(false);
        expect(parser.parse(wrapper(replace(STATUS, 7, 2)))).toBe(false);
        expect(parser.parse(wrapper(STATUS, true))).toBe(false);
        expect([parser.requestId, parser.channel]).toEqual([0, 0]);

        expect(parser.parse(wrapper(STATUS))).toBe(true);
        expect(parser.flush()).toBe(true);
        expect([parser.requestId, parser.powered, parser.frequency, parser.channelLabel]).toEqual([0, false, 1001, '']);
    });
    it('reads real transmissions with server-owned identity and channel', () =>
    {
        const parser = new RpRadioTransmissionParser();
        expect(parser.parse(wrapper(TRANSMISSION))).toBe(true);
        expect([parser.channel, parser.frequency, parser.channelLabel, parser.senderId, parser.senderName, parser.senderRank, parser.text, parser.sentAt])
            .toEqual([0, 1234, 'Public', 5, 'alice', '', 'meet at the bank', 1700000000]);

        expect(parser.parse(wrapper([2, 0, 'Gang', 9, 'bob', 'Soldier', 'fall back', 1700000001]))).toBe(true);
        expect([parser.channel, parser.frequency, parser.senderRank, parser.text]).toEqual([2, 0, 'Soldier', 'fall back']);

        expect(parser.parse(wrapper(replace(TRANSMISSION, 0, 3)))).toBe(false);
        expect(parser.parse(wrapper(replace(TRANSMISSION, 1, 0)))).toBe(false);
        expect(parser.parse(wrapper(replace(replace(TRANSMISSION, 0, 1), 1, 1234)))).toBe(false);
        expect(parser.parse(wrapper(replace(TRANSMISSION, 3, 0)))).toBe(false);
        expect(parser.parse(wrapper(replace(TRANSMISSION, 4, '')))).toBe(false);
        expect(parser.parse(wrapper(replace(TRANSMISSION, 5, 'x'.repeat(41))))).toBe(false);
        expect(parser.parse(wrapper(replace(TRANSMISSION, 6, '')))).toBe(false);
        expect(parser.parse(wrapper(replace(TRANSMISSION, 6, 'x'.repeat(121))))).toBe(false);
        expect(parser.parse(wrapper(replace(TRANSMISSION, 7, 0)))).toBe(false);
        expect(parser.parse(wrapper(TRANSMISSION, true))).toBe(false);
        expect([parser.channel, parser.senderName, parser.text]).toEqual([0, '', '']);

        expect(parser.parse(wrapper(TRANSMISSION))).toBe(true);
        expect(parser.flush()).toBe(true);
        expect([parser.senderId, parser.sentAt]).toEqual([0, 0]);
    });
    it('keeps the composer field order and rejects impossible values', () =>
    {
        expect(new RpRadioRequestComposer(5, 3, 0, 1001, 'hello').getMessageArray()).toEqual([5, 3, 0, 1001, 'hello']);
        expect(new RpRadioRequestComposer(6, 1, 1, 0, '').getMessageArray()).toEqual([6, 1, 1, 0, '']);
        expect(new RpRadioRequestComposer(7, 2, 2, 0, '').getMessageArray()).toEqual([7, 2, 2, 0, '']);
        expect(new RpRadioRequestComposer(8, 0, 0, 0, '').getMessageArray()).toEqual([8, 0, 0, 0, '']);

        expect(() => new RpRadioRequestComposer(0, 0, 0, 0, '')).toThrow(RangeError);
        expect(() => new RpRadioRequestComposer(1, 4, 0, 0, '')).toThrow(RangeError);
        expect(() => new RpRadioRequestComposer(1, 0, 3, 0, '')).toThrow(RangeError);
        expect(() => new RpRadioRequestComposer(1, 2, 0, 1000, '')).toThrow(RangeError);
        expect(() => new RpRadioRequestComposer(1, 2, 0, 10000, '')).toThrow(RangeError);
        expect(() => new RpRadioRequestComposer(1, 3, 0, 1001, 'x'.repeat(121))).toThrow(RangeError);
        expect(() => new RpRadioRequestComposer(1, 1, 1, 0, 'hello')).toThrow(RangeError);
        expect(() => new RpRadioRequestComposer(1, 2, 0, 0, '')).toThrow(RangeError);
        expect(() => new RpRadioRequestComposer(1, 2, 2, 1234, '')).toThrow(RangeError);
    });
});