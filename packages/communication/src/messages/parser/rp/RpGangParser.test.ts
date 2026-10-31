import { IMessageDataWrapper } from '@volt/api';
import { describe, expect, it } from 'vitest';
import { VoltMessages } from '../../../VoltMessages';
import { RpGangEvent } from '../../incoming/rp';
import { RpGangRequestComposer } from '../../outgoing/rp';
import { RpGangParser, RpGangSnapshot } from './RpGangParser';

const data = (): RpGangSnapshot => ({ available: true, message: '', cost: 300, maxMembers: 50, myGangId: 4, myRequests: [],
    gang: { id: 4, name: 'Kings', description: 'Run the city', badge: 'b0101s01011', leaderId: 5, leaderName: 'teniser', memberCount: 2,
        kills: 3, deaths: 1, myRankId: 1, canManage: true, isLeader: true, requested: false,
        ranks: [{ id: 1, name: 'Leader', position: 0, canManage: true, isLeader: true, members: 1 }, { id: 2, name: 'Member', position: 1, canManage: false, isLeader: false, members: 1 }],
        members: [{ userId: 5, username: 'teniser', figure: 'hd-180-1', gender: 'M', rankId: 1, online: true }, { userId: 6, username: 'bob', figure: 'hd-180-1', gender: 'F', rankId: 2, online: false }],
        requests: [{ userId: 7, username: 'amy', figure: 'hd-180-1', gender: 'F' }] },
    search: [{ id: 4, name: 'Kings', badge: 'b0101', memberCount: 2, leaderName: 'teniser', requested: false }] });
const wrapper = (json: string, id = 1, extra = false) => ({ readInt: () => id, readString: () => json, bytesAvailable: extra }) as IMessageDataWrapper;

describe('Gang protocol', () =>
{
    it('reads the correlated snapshot and registers both directions', () =>
    {
        const parser = new RpGangParser();
        expect(parser.parse(wrapper(JSON.stringify(data()), 19))).toBe(true);
        expect(parser.requestId).toBe(19);
        expect(parser.snapshot).toEqual(data());
        const messages = new VoltMessages();
        expect(messages.events.get(6110)).toBe(RpGangEvent);
        expect(messages.composers.get(6110)).toBe(RpGangRequestComposer);
        expect(new RpGangRequestComposer(7, 8, 4, 6, 2, 'x').getMessageArray()).toEqual([7, 8, 4, 6, 2, 'x']);
    });
    it('accepts a player without a gang', () =>
    {
        expect(new RpGangParser().parse(wrapper(JSON.stringify({ ...data(), myGangId: 0, gang: null })))).toBe(true);
    });
    it.each(['{', '{}', 'null', '[]'])('rejects invalid JSON %s and clears old state', json =>
    {
        const parser = new RpGangParser();
        expect(parser.parse(wrapper(JSON.stringify(data())))).toBe(true);
        expect(parser.parse(wrapper(json))).toBe(false);
        expect(parser.snapshot).toBeNull();
        expect(parser.requestId).toBe(0);
    });
    it('rejects members in unknown ranks, duplicate members, bad counts, extra bytes and bad IDs', () =>
    {
        const parser = new RpGangParser();
        const unknownRank = data(); unknownRank.gang!.members[1].rankId = 9;
        const duplicate = data(); duplicate.gang!.members[1].userId = 5;
        const count = data(); count.gang!.memberCount = 3;
        const leader = data(); leader.gang!.canManage = false;
        for(const bad of [unknownRank, duplicate, count, leader]) expect(parser.parse(wrapper(JSON.stringify(bad)))).toBe(false);
        expect(parser.parse(wrapper(JSON.stringify(data()), 0))).toBe(false);
        expect(parser.parse(wrapper(JSON.stringify(data()), 1, true))).toBe(false);
        expect(parser.parse(wrapper(' '.repeat(48001)))).toBe(false);
    });
});
