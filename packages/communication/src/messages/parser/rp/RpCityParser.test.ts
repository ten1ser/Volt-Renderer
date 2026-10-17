import { IMessageDataWrapper } from '@volt/api';
import { describe, expect, it } from 'vitest';
import { RpCityParser } from './RpCityParser';
import { RpCityEvent } from '../../incoming/rp';
import { RpCityRequestComposer } from '../../outgoing/rp';
import { VoltMessages } from '../../../VoltMessages';
const wrapper = (values: number[]): IMessageDataWrapper =>
{
    let offset = 0;
    return { get remainingBytes() { return (values.length - offset) * 4; },
        get bytesAvailable() { return offset < values.length; }, readInt() { if(offset >= values.length) throw new Error('Truncated'); return values[offset++]; } } as IMessageDataWrapper;
};
describe('city protocol', () =>
{
    it('reads server phase, phase lengths and hotel population in order', () =>
    {
        const parser = new RpCityParser();
        expect(parser.parse(wrapper([900000, 1800000, 900000, 32]))).toBe(true);
        expect([parser.cycleElapsedMs, parser.cycleDurationMs, parser.dayDurationMs, parser.onlinePlayers]).toEqual([900000, 1800000, 900000, 32]);
        parser.flush();
        expect(parser.cycleDurationMs).toBe(0);
    });
    it.each([[], [1], [1, 2, 3], [-1, 1800000, 900000, 0], [1800000, 1800000, 900000, 0], [0, 0, 0, 0], [0, 1800000, 900000, -1], [0, 1800000, 900000, 1, 2]])('rejects invalid snapshot %j', (...values) =>
    {
        expect(new RpCityParser().parse(wrapper(values))).toBe(false);
    });
    it('registers both directions at 6050 and sends an empty request', () =>
    {
        const messages = new VoltMessages();
        expect(messages.events.get(6050)).toBe(RpCityEvent);
        expect(messages.composers.get(6050)).toBe(RpCityRequestComposer);
        expect(new RpCityRequestComposer().getMessageArray()).toEqual([]);
    });
});
