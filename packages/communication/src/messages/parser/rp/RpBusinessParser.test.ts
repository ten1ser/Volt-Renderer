import { IMessageDataWrapper } from '@volt/api';
import { describe, expect, it } from 'vitest';
import { VoltMessages } from '../../../VoltMessages';
import { RpBusinessEvent } from '../../incoming/rp';
import { RpBusinessRequestComposer } from '../../outgoing/rp';
import { RpBusinessParser, RpBusinessSnapshot } from './RpBusinessParser';

const data = (): RpBusinessSnapshot => ({ available: true, message: '', groupId: 1, name: 'Hospital', badge: 'b01011s01011', roomId: 3,
    totalEmployees: 1, onDutyCount: 1, canManageRanks: false, canManageMembers: false, page: 0, pageSize: 25, totalMatches: 1,
    ranks: [{ level: 1, name: 'Trainee', pay: 7 }], employees: [{ userId: 5, username: 'teniser', figure: 'hd-180-1', gender: 'M', level: 1, onDuty: true }],
    self: { member: true, level: 1, onDuty: true, remainingMs: 300000, periodMs: 600000 } });
const wrapper = (json: string, id = 1, extra = false) => ({ readInt: () => id, readString: () => json, bytesAvailable: extra }) as IMessageDataWrapper;

describe('Business directory protocol', () =>
{
    it('reads the correlated authoritative snapshot and registers both directions', () =>
    {
        const parser = new RpBusinessParser();
        expect(parser.parse(wrapper(JSON.stringify(data()), 19))).toBe(true);
        expect(parser.requestId).toBe(19);
        expect(parser.snapshot).toEqual(data());
        const messages = new VoltMessages();
        expect(messages.events.get(6070)).toBe(RpBusinessEvent);
        expect(messages.composers.get(6070)).toBe(RpBusinessRequestComposer);
        expect(new RpBusinessRequestComposer(7, 3, 5, 11, 2, 1, 'test').getMessageArray()).toEqual([7, 3, 5, 11, 2, 1, 'test']);
    });
    it.each(['{', '{}', 'null', '[]'])('rejects invalid JSON data %s and clears old state', json =>
    {
        const parser = new RpBusinessParser();
        expect(parser.parse(wrapper(JSON.stringify(data())))).toBe(true);
        expect(parser.parse(wrapper(json))).toBe(false);
        expect(parser.snapshot).toBeNull();
        expect(parser.requestId).toBe(0);
    });
    it('rejects extra bytes, bad request IDs, oversized payloads and truncated wrappers', () =>
    {
        const parser = new RpBusinessParser();
        expect(parser.parse(wrapper(JSON.stringify(data()), 0))).toBe(false);
        expect(parser.parse(wrapper(JSON.stringify(data()), 1, true))).toBe(false);
        expect(parser.parse(wrapper(' '.repeat(48001)))).toBe(false);
        expect(parser.parse({ readInt: () => { throw new Error('Truncated'); } } as unknown as IMessageDataWrapper)).toBe(false);
    });
    it.each([
        (value: RpBusinessSnapshot) => { value.self.remainingMs = -1; },
        (value: RpBusinessSnapshot) => { value.self.periodMs = 1; },
        (value: RpBusinessSnapshot) => { value.self.member = false; },
        (value: RpBusinessSnapshot) => { value.ranks.push(value.ranks[0]); },
        (value: RpBusinessSnapshot) => { value.employees.push(value.employees[0]); },
        (value: RpBusinessSnapshot) => { value.employees[0].level = 99; },
        (value: RpBusinessSnapshot) => { value.onDutyCount = 2; },
        (value: RpBusinessSnapshot) => { value.employees[0].username = 'a'.repeat(65); }
    ])('rejects inconsistent or unbounded nested values', mutate =>
    {
        const value = data(); mutate(value);
        expect(new RpBusinessParser().parse(wrapper(JSON.stringify(value)))).toBe(false);
    });
});
