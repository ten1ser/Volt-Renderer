import { IMessageDataWrapper } from '@volt/api';
import { describe, expect, it } from 'vitest';
import { VoltMessages } from '../../../VoltMessages';
import { RpActionProgressEvent, RpFeedLineEvent } from '../../incoming/rp';
import { RpActionProgressParser } from './RpActionProgressParser';
import { RpFeedLineParser } from './RpFeedLineParser';

const wrapper = (values: (number | string)[], extra = false) =>
{
    let index = 0;
    const next = () => values[index++];
    return { readInt: next, readString: next, bytesAvailable: extra } as unknown as IMessageDataWrapper;
};

describe('Feed protocol', () =>
{
    it('registers both events on 6130-6131', () =>
    {
        const messages = new VoltMessages();
        expect([6130, 6131].map(id => messages.events.get(id))).toEqual([RpFeedLineEvent, RpActionProgressEvent]);
    });

    it('reads log lines and rejects malformed ones', () =>
    {
        const parser = new RpFeedLineParser();
        expect(parser.parse(wrapper([1, 'alice', 'bob', 'fist']))).toBe(true);
        expect([parser.kind, parser.actorName, parser.targetName, parser.detail]).toEqual([1, 'alice', 'bob', 'fist']);
        expect(parser.parse(wrapper([2, 'alice', '', 'Murder']))).toBe(true);
        expect(parser.parse(wrapper([3, 'alice', 'bob', '1999']))).toBe(true);

        expect(parser.parse(wrapper([5, 'alice', 'bob', '']))).toBe(false);
        expect(parser.parse(wrapper([0, '', 'bob', '']))).toBe(false);
        expect(parser.parse(wrapper([0, 'alice', '', '']))).toBe(false);
        expect(parser.parse(wrapper([4, 'alice', 'bob', '']))).toBe(false);
        expect(parser.parse(wrapper([3, 'alice', 'bob', '-5']))).toBe(false);
        expect(parser.parse(wrapper([0, 'alice', 'bob', ''], true))).toBe(false);
        expect(parser.parse(wrapper([0, 'alice']))).toBe(false);
        expect([parser.actorName, parser.targetName]).toEqual(['', '']);
    });

    it('reads progress starts and hides within bounds', () =>
    {
        const parser = new RpActionProgressParser();
        expect(parser.parse(wrapper([0, 3000]))).toBe(true);
        expect([parser.kind, parser.durationMs]).toEqual([0, 3000]);
        expect(parser.parse(wrapper([1, 0]))).toBe(true);
        expect(parser.parse(wrapper([2, 3000]))).toBe(false);
        expect(parser.parse(wrapper([0, 60001]))).toBe(false);
        expect(parser.parse(wrapper([0, -1]))).toBe(false);
        expect(parser.parse(wrapper([0, 3000], true))).toBe(false);
    });
});
