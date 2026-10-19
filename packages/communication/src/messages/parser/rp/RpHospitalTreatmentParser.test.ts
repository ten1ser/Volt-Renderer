import { IMessageDataWrapper } from '@volt/api';
import { describe, expect, it } from 'vitest';
import { RpHospitalTreatmentParser } from './RpHospitalTreatmentParser';
import { RpHospitalTreatmentEvent } from '../../incoming/rp';
import { RpHospitalTreatmentRequestComposer } from '../../outgoing/rp';
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

describe('DistrictRP hospital treatment protocol', () =>
{
    it.each([[0, 0, 0], [1, 0, 10000], [2, 0, 100000], [2, 37, 63000], [2, 100, 0]])(
        'reads phase %i, progress %i and remaining %i in wire order', (phase, progress, remainingMs) =>
        {
            const parser = new RpHospitalTreatmentParser();
            expect(parser.parse(wrapper([phase, progress, remainingMs]))).toBe(true);
            expect([parser.phase, parser.progress, parser.remainingMs]).toEqual([phase, progress, remainingMs]);
        });

    it.each([
        [], [0], [0, 0], [0, 0, 0, 0], [-1, 0, 0], [3, 0, 0], [0, 1, 0], [0, 0, 1],
        [1, 1, 0], [1, 0, -1], [2, -1, 0], [2, 101, 0], [2, 50, -1]
    ])('rejects malformed or out-of-contract snapshots %j', (...values) =>
    {
        const parser = new RpHospitalTreatmentParser();
        expect(parser.parse(wrapper(values))).toBe(false);
    });

    it('flushes the prior users status', () =>
    {
        const parser = new RpHospitalTreatmentParser();
        parser.parse(wrapper([2, 40, 60000]));
        parser.flush();
        expect([parser.phase, parser.progress, parser.remainingMs]).toEqual([0, 0, 0]);
    });

    it('clears the previous snapshot when a subsequent payload is invalid', () =>
    {
        const parser = new RpHospitalTreatmentParser();
        expect(parser.parse(wrapper([2, 40, 6000]))).toBe(true);
        expect(parser.parse(wrapper([2, 101, 1000]))).toBe(false);
        expect([parser.phase, parser.progress, parser.remainingMs]).toEqual([0, 0, 0]);
    });

    it('registers both directions at 6060 and sends no client-controlled values', () =>
    {
        const registry = new VoltMessages();
        expect(registry.events.get(6060)).toBe(RpHospitalTreatmentEvent);
        expect(registry.composers.get(6060)).toBe(RpHospitalTreatmentRequestComposer);
        expect(new RpHospitalTreatmentRequestComposer().getMessageArray()).toEqual([]);
    });
});
