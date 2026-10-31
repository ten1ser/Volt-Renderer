import { IMessageDataWrapper, IMessageParser } from '@volt/api';

export type RpGangRank = { id: number; name: string; position: number; canManage: boolean; isLeader: boolean; members: number };
export type RpGangMember = { userId: number; username: string; figure: string; gender: string; rankId: number; online: boolean };
export type RpGangPerson = { userId: number; username: string; figure: string; gender: string };
export type RpGangListing = { id: number; name: string; badge: string; memberCount: number; leaderName: string; requested: boolean };
export type RpGang = {
    id: number; name: string; description: string; badge: string; leaderId: number; leaderName: string; memberCount: number;
    kills: number; deaths: number; ranks: RpGangRank[]; members: RpGangMember[]; requests: RpGangPerson[];
    myRankId: number; canManage: boolean; isLeader: boolean; requested: boolean;
};
export type RpGangSnapshot = {
    available: boolean; message: string; cost: number; maxMembers: number; myGangId: number; myRequests: number[];
    gang: RpGang | null; search: RpGangListing[];
};

const integer = (value: unknown, max = 2147483647, min = 0): value is number => Number.isInteger(value) && Number(value) >= min && Number(value) <= max;
const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length <= max;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const gender = (value: unknown): boolean => value === 'M' || value === 'F';
const person = (value: unknown): value is RpGangPerson =>
    record(value) && integer(value.userId, 2147483647, 1) && text(value.username, 64) && text(value.figure, 256) && gender(value.gender);

const isGang = (gang: unknown): gang is RpGang =>
{
    if(!record(gang) || !integer(gang.id, 2147483647, 1) || !text(gang.name, 50) || !text(gang.description, 255) || !text(gang.badge, 50) ||
        !integer(gang.leaderId) || !text(gang.leaderName, 64) || !integer(gang.memberCount) || !integer(gang.kills) || !integer(gang.deaths) ||
        !integer(gang.myRankId) || typeof gang.canManage !== 'boolean' || typeof gang.isLeader !== 'boolean' || typeof gang.requested !== 'boolean' ||
        !Array.isArray(gang.ranks) || gang.ranks.length > 10 || !Array.isArray(gang.members) || gang.members.length > 500 ||
        !Array.isArray(gang.requests) || gang.requests.length > 25) return false;
    const ranks = new Set<number>();
    for(const rank of gang.ranks)
    {
        if(!record(rank) || !integer(rank.id, 2147483647, 1) || !text(rank.name, 24) || !integer(rank.position) || typeof rank.canManage !== 'boolean' ||
            typeof rank.isLeader !== 'boolean' || !integer(rank.members) || ranks.has(rank.id)) return false;
        ranks.add(rank.id);
    }
    const users = new Set<number>();
    for(const member of gang.members)
    {
        if(!person(member) || !ranks.has(Number((member as RpGangMember).rankId)) || typeof (member as RpGangMember).online !== 'boolean' || users.has(member.userId)) return false;
        users.add(member.userId);
    }
    return gang.requests.every(person) && gang.memberCount === gang.members.length && (gang.myRankId === 0 || ranks.has(gang.myRankId)) &&
        (!gang.isLeader || gang.canManage);
};

export const isRpGangSnapshot = (data: unknown): data is RpGangSnapshot =>
{
    if(!record(data) || typeof data.available !== 'boolean' || !text(data.message, 256) || !integer(data.cost) || !integer(data.maxMembers, 500) ||
        !integer(data.myGangId) || !Array.isArray(data.myRequests) || data.myRequests.length > 25 || !data.myRequests.every(id => integer(id, 2147483647, 1)) ||
        !Array.isArray(data.search) || data.search.length > 25 || (data.gang !== null && !isGang(data.gang))) return false;
    return data.search.every(item => record(item) && integer(item.id, 2147483647, 1) && text(item.name, 50) && text(item.badge, 50) &&
        integer(item.memberCount) && text(item.leaderName, 64) && typeof item.requested === 'boolean');
};

export class RpGangParser implements IMessageParser
{
    private _requestId = 0;
    private _snapshot: RpGangSnapshot | null = null;
    public flush(): boolean { this._requestId = 0; this._snapshot = null; return true; }
    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        try
        {
            const id = wrapper.readInt();
            const json = wrapper.readString();
            if(!integer(id, 2147483647, 1) || new TextEncoder().encode(json).length > 48000 || wrapper.bytesAvailable) return false;
            const data: unknown = JSON.parse(json);
            if(!isRpGangSnapshot(data)) return false;
            this._requestId = id;
            this._snapshot = data;
            return true;
        }
        catch { return false; }
    }
    public get requestId(): number { return this._requestId; }
    public get snapshot(): RpGangSnapshot | null { return this._snapshot; }
}
