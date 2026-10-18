import { IMessageDataWrapper } from '@volt/api';
import { describe, expect, it } from 'vitest';
import { RpTargetStatsParser } from './RpTargetStatsParser';
import { RpTargetStatsRequestComposer } from '../../outgoing/rp';
import { RpTargetStatsEvent } from '../../incoming/rp';
import { VoltMessages } from '../../../VoltMessages';

const wrapper = (values: number[], options: { remainingBytes?: number; bytesAvailable?: boolean } = {}): IMessageDataWrapper =>
{
    let offset = 0;
    return {
        get remainingBytes()
        {
            return options.remainingBytes ?? (values.length - offset) * 4;
        },
        get bytesAvailable()
        {
            return options.bytesAvailable ?? offset < values.length;
        },
        readInt()
        {
            if(offset >= values.length) throw new Error('Truncated'); return values[offset++];
        }
    } as IMessageDataWrapper;
};

const available = [7, 12, 34, 1, 100, 0];
const unavailable = [7, 12, 34, 0, 0, 0];

describe('DistrictRP target stats protocol', () =>
{
    it('reads an available target in wire order', () =>
    {
        const parser = new RpTargetStatsParser();
        expect(parser.parse(wrapper(available))).toBe(true);
        expect([parser.requestId, parser.roomId, parser.targetUserId, parser.available, parser.health, parser.energy])
            .toEqual([7, 12, 34, true, 100, 0]);
    });

    it('reads an unavailable target with zero stats', () =>
    {
        const parser = new RpTargetStatsParser();
        expect(parser.parse(wrapper(unavailable))).toBe(true);
        expect([parser.requestId, parser.roomId, parser.targetUserId, parser.available, parser.health, parser.energy])
            .toEqual([7, 12, 34, false, 0, 0]);
    });

    it.each([
        [[7, 12, 34, 1, 0, 100]],
        [[7, 12, 34, 1, 73, 29]],
        [[1, 2147483647, 2147483647, 1, 0, 0]]
    ])('accepts valid available snapshots %j', values =>
    {
        const parser = new RpTargetStatsParser();
        expect(parser.parse(wrapper(values))).toBe(true);
    });

    it.each([
        [[], 'empty'],
        [[7, 12, 34, 1, 50], 'five ints'],
        [[7, 12, 34, 1, 50, 50, 1], 'seven ints'],
        [[7, 12, 34, 1, 50, 50, 1, 2], 'eight ints']
    ])('rejects a payload with %s', (values) =>
    {
        const parser = new RpTargetStatsParser();
        expect(parser.parse(wrapper(values))).toBe(false);
    });

    it('rejects trailing bytes after six ints', () =>
    {
        const parser = new RpTargetStatsParser();
        expect(parser.parse(wrapper(available, { remainingBytes: 25 }))).toBe(false);
        expect(parser.parse(wrapper(available, { bytesAvailable: true }))).toBe(false);
    });

    it('rejects a truncated read even when the length header claims 24 bytes', () =>
    {
        const parser = new RpTargetStatsParser();
        expect(parser.parse(wrapper(available.slice(0, 5), { remainingBytes: 24 }))).toBe(false);
    });

    it.each([
        [[0, 12, 34, 1, 50, 50], 'zero requestId'],
        [[-1, 12, 34, 1, 50, 50], 'negative requestId'],
        [[7, 0, 34, 1, 50, 50], 'zero roomId'],
        [[7, 12, 0, 1, 50, 50], 'zero targetUserId'],
        [[7, 12, 2147483648, 1, 50, 50], 'targetUserId above int32'],
        [[7, 12.5, 34, 1, 50, 50], 'fractional roomId']
    ])('rejects invalid IDs: %s', (values) =>
    {
        const parser = new RpTargetStatsParser();
        expect(parser.parse(wrapper(values))).toBe(false);
    });

    it.each([
        [[7, 12, 34, 2, 50, 50], 'available 2'],
        [[7, 12, 34, -1, 50, 50], 'available -1'],
        [[7, 12, 34, 0, 1, 0], 'unavailable with health'],
        [[7, 12, 34, 0, 0, 1], 'unavailable with energy'],
        [[7, 12, 34, 1, 101, 50], 'health above 100'],
        [[7, 12, 34, 1, 50, -1], 'energy below 0'],
        [[7, 12, 34, 1, 50.5, 50], 'fractional health']
    ])('rejects invalid flags or stats: %s', (values) =>
    {
        const parser = new RpTargetStatsParser();
        expect(parser.parse(wrapper(values))).toBe(false);
    });

    it('keeps the previous valid snapshot when a later packet is rejected', () =>
    {
        const parser = new RpTargetStatsParser();
        parser.parse(wrapper(available));
        expect(parser.parse(wrapper([8, 13, 35, 0, 1, 0]))).toBe(false);
        expect([parser.requestId, parser.roomId, parser.targetUserId, parser.available, parser.health, parser.energy])
            .toEqual([7, 12, 34, true, 100, 0]);
    });

    it('flush resets every field', () =>
    {
        const parser = new RpTargetStatsParser();
        parser.parse(wrapper(available));
        expect(parser.flush()).toBe(true);
        expect([parser.requestId, parser.roomId, parser.targetUserId, parser.available, parser.health, parser.energy])
            .toEqual([0, 0, 0, false, 0, 0]);
    });

    it('builds the request in exact order and validates IDs', () =>
    {
        expect(new RpTargetStatsRequestComposer(7, 12, 34).getMessageArray()).toEqual([7, 12, 34]);
        expect(() => new RpTargetStatsRequestComposer(0, 12, 34)).toThrow(RangeError);
        expect(() => new RpTargetStatsRequestComposer(7, -1, 34)).toThrow(RangeError);
        expect(() => new RpTargetStatsRequestComposer(7, 12, 1.5)).toThrow(RangeError);
        expect(() => new RpTargetStatsRequestComposer(7, 12, 2147483648)).toThrow(RangeError);
        expect(() => new RpTargetStatsRequestComposer(Number.NaN, 12, 34)).toThrow(RangeError);
    });

    it('registers both directions at 6041 and exposes the event through the RP index', () =>
    {
        const registry = new VoltMessages();
        expect(registry.events.get(6041)).toBe(RpTargetStatsEvent);
        expect(registry.composers.get(6041)).toBe(RpTargetStatsRequestComposer);
    });
});
