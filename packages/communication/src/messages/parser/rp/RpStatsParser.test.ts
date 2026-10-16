import { IMessageDataWrapper } from '@volt/api';
import { describe, expect, it } from 'vitest';
import { RpStatsParser } from './RpStatsParser';
import { RpStatsRequestComposer } from '../../outgoing/rp';
import { RpStatsEvent } from '../../incoming/rp';
import { VoltMessages } from '../../../VoltMessages';

const wrapper = (values: number[]): IMessageDataWrapper =>
{
    let offset = 0;
    return {
        get remainingBytes() { return (values.length - offset) * 4; },
        get bytesAvailable() { return offset < values.length; },
        readInt() { if(offset >= values.length) throw new Error('Truncated'); return values[offset++]; }
    } as IMessageDataWrapper;
};

describe('DistrictRP stats protocol', () =>
{
    it.each([[100, 100], [0, 0], [73, 29]])('reads health %i and energy %i in wire order', (health, energy) =>
    {
        const parser = new RpStatsParser();
        expect(parser.parse(wrapper([health, energy]))).toBe(true);
        expect([parser.health, parser.energy]).toEqual([health, energy]);
    });

    it.each([[], [50], [1, 2, 3], [-1, 50], [101, 50], [50, -1], [50, 101]])('rejects malformed or out-of-range snapshots %j', (...values) =>
    {
        const parser = new RpStatsParser();
        expect(parser.parse(wrapper(values))).toBe(false);
    });

    it('flushes the prior users values', () =>
    {
        const parser = new RpStatsParser();
        parser.parse(wrapper([73, 29]));
        parser.flush();
        expect([parser.health, parser.energy]).toEqual([0, 0]);
    });

    it('registers both directions at 6040 and sends no client-controlled user or values', () =>
    {
        const registry = new VoltMessages();
        expect(registry.events.get(6040)).toBe(RpStatsEvent);
        expect(registry.composers.get(6040)).toBe(RpStatsRequestComposer);
        expect(new RpStatsRequestComposer().getMessageArray()).toEqual([]);
    });
});
