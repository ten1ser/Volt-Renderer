import { IMessageDataWrapper } from '@volt/api';
import { describe, expect, it } from 'vitest';
import { VoltMessages } from '../../../VoltMessages';
import { IncomingHeader } from '../../incoming/IncomingHeader';
import { RpInventoryEvent } from '../../incoming/rp';
import { OutgoingHeader } from '../../outgoing/OutgoingHeader';
import { RpInventoryRequestComposer } from '../../outgoing/rp';
import { RpInventoryParser } from './RpInventoryParser';

type Slot = [string, string, number, number, number, number];

const EMPTY: Slot = ['', '', 0, 0, 0, 0];
const slots = (overrides: Record<number, Slot> = {}): Slot[] =>
    Array.from({ length: 10 }, (_, index) => overrides[index] ?? EMPTY);
const standard = () => slots({ 0: ['pistol', 'Glock 17', 1, 1, 0, 0], 1: ['vest', 'Armor Vest', 2, 1, 60, 100] });

const wrapper = (head: [number, number, string, number], body: Slot[], extra = false) =>
{
    const values: (number | string)[] = [...head, ...body.flat()];
    let index = 0;
    const next = () => values[index++];
    return { readInt: next, readString: next, bytesAvailable: extra } as unknown as IMessageDataWrapper;
};

describe('Inventory protocol', () =>
{
    it('reads a full snapshot in wire order and registers both directions', () =>
    {
        const parser = new RpInventoryParser();
        expect(parser.parse(wrapper([7, 0, '', 10], standard()))).toBe(true);
        expect(parser.requestId).toBe(7);
        expect(parser.result).toBe(0);
        expect(parser.slots.map(slot => slot.slot)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(parser.slots[0]).toEqual({ slot: 1, key: 'pistol', name: 'Glock 17', kind: 1, quantity: 1, durability: 0, maxDurability: 0 });
        expect(parser.slots[1]).toEqual({ slot: 2, key: 'vest', name: 'Armor Vest', kind: 2, quantity: 1, durability: 60, maxDurability: 100 });
        expect(parser.slots[2].key).toBe('');

        const messages = new VoltMessages();
        expect(IncomingHeader.RP_INVENTORY).toBe(6080);
        expect(OutgoingHeader.RP_INVENTORY_REQUEST).toBe(6080);
        expect(messages.events.get(6080)).toBe(RpInventoryEvent);
        expect(messages.composers.get(6080)).toBe(RpInventoryRequestComposer);
    });

    it('keeps denial and destroy-confirmation messages', () =>
    {
        const parser = new RpInventoryParser();
        expect(parser.parse(wrapper([3, 2, 'Nobody is next to you. Destroy your Glock 17?', 10], standard()))).toBe(true);
        expect([parser.result, parser.message]).toEqual([2, 'Nobody is next to you. Destroy your Glock 17?']);
    });

    it('rejects malformed snapshots and resets to defaults', () =>
    {
        const parser = new RpInventoryParser();
        expect(parser.parse(wrapper([7, 0, '', 10], standard()))).toBe(true);
        expect(parser.parse(wrapper([7, 0, '', 9], standard().slice(0, 9)))).toBe(false);
        expect([parser.requestId, parser.result, parser.message, parser.slots.length]).toEqual([0, 0, '', 0]);
        expect(parser.parse(wrapper([7, 0, '', 10], standard(), true))).toBe(false);
        expect(parser.parse(wrapper([7, 3, '', 10], standard()))).toBe(false);
        expect(parser.parse(wrapper([7, 0, '', 10], slots({ 4: ['mp5', 'MP5', 4, 1, 0, 0] })))).toBe(false);
        expect(parser.parse(wrapper([7, 0, '', 10], slots({ 4: ['', '', 0, 1, 0, 0] })))).toBe(false);
        expect(parser.parse(wrapper([7, 0, '', 10], slots({ 4: ['vest', 'Armor Vest', 2, 1, 101, 100] })))).toBe(false);
        expect(parser.parse(wrapper([7, 0, '', 10], slots({ 4: ['Bad Key', 'x', 3, 1, 0, 0] })))).toBe(false);
        expect(parser.parse({ readInt: () => { throw new Error('truncated'); } } as unknown as IMessageDataWrapper)).toBe(false);
        expect(parser.slots).toEqual([]);
    });

    it('serializes requests and rejects invalid arguments', () =>
    {
        expect(new RpInventoryRequestComposer(7, 1, 3, 1, 0).getMessageArray()).toEqual([7, 1, 3, 1, 0]);
        expect(new RpInventoryRequestComposer(1, 3, 3, 0, 42).getMessageArray()).toEqual([1, 3, 3, 0, 42]);
        expect(() => new RpInventoryRequestComposer(7, 5, 3, 1, 0)).toThrow();
        expect(() => new RpInventoryRequestComposer(7, 1, 11, 1, 0)).toThrow();
        expect(() => new RpInventoryRequestComposer(0, 1, 3, 1, 0)).toThrow();
        expect(() => new RpInventoryRequestComposer(7, 1, 3, 1, -1)).toThrow();
    });
});
