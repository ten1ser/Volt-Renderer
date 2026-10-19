import { IMessageDataWrapper, IMessageParser } from '@volt/api';

export type RpBusinessRank = { level: number; name: string; pay: number };
export type RpBusinessEmployee = { userId: number; username: string; figure: string; gender: string; level: number; onDuty: boolean };
export type RpBusinessSnapshot = {
    available: boolean; message: string; groupId: number; name: string; badge: string; roomId: number;
    totalEmployees: number; onDutyCount: number; canManageRanks: boolean; canManageMembers: boolean;
    page: number; pageSize: number; totalMatches: number; ranks: RpBusinessRank[]; employees: RpBusinessEmployee[];
    self: { member: boolean; level: number; onDuty: boolean; remainingMs: number; periodMs: number };
};

const integer = (value: unknown, max = 2147483647, min = 0): value is number => Number.isInteger(value) && Number(value) >= min && Number(value) <= max;
const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length <= max;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export const isRpBusinessSnapshot = (data: unknown): data is RpBusinessSnapshot =>
{
    if(!record(data) || !record(data.self)) return false;
    const own = data.self;
    if(typeof data.available !== 'boolean' || !text(data.message, 512) || !integer(data.groupId) || !text(data.name, 100) ||
        !text(data.badge, 100) || !integer(data.roomId) || !integer(data.totalEmployees) || !integer(data.onDutyCount) ||
        Number(data.onDutyCount) > Number(data.totalEmployees) || typeof data.canManageRanks !== 'boolean' || typeof data.canManageMembers !== 'boolean' ||
        !integer(data.page, 40000) || data.pageSize !== 25 || !integer(data.totalMatches) || Number(data.totalMatches) > Number(data.totalEmployees) ||
        typeof own.member !== 'boolean' || !integer(own.level) || typeof own.onDuty !== 'boolean' ||
        !integer(own.remainingMs, 600000) || own.periodMs !== 600000 || (!own.onDuty && own.remainingMs !== 0) || (own.onDuty && !own.member) ||
        !Array.isArray(data.ranks) || data.ranks.length > 64 || !Array.isArray(data.employees) || data.employees.length > 25) return false;
    const levels = new Set<number>();
    for(const rank of data.ranks)
    {
        if(!record(rank) || !integer(rank.level, 2147483647, 1) || !text(rank.name, 64) || !rank.name.trim() || !integer(rank.pay, 2147483647, 1) || levels.has(rank.level)) return false;
        levels.add(rank.level);
    }
    const users = new Set<number>();
    for(const user of data.employees)
    {
        if(!record(user) || !integer(user.userId, 2147483647, 1) || !text(user.username, 64) || !text(user.figure, 512) ||
            !text(user.gender, 1) || !['M', 'F', 'm', 'f'].includes(user.gender) || !levels.has(Number(user.level)) ||
            typeof user.onDuty !== 'boolean' || users.has(user.userId)) return false;
        users.add(user.userId);
    }
    return (!data.available || (Number(data.groupId) > 0 && Number(data.roomId) > 0 && levels.size > 0)) &&
        (!own.member || levels.has(Number(own.level))) && data.employees.length <= Number(data.totalMatches);
};

export class RpBusinessParser implements IMessageParser
{
    private _requestId = 0;
    private _snapshot: RpBusinessSnapshot | null = null;
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
            if(!isRpBusinessSnapshot(data)) return false;
            this._requestId = id;
            this._snapshot = data;
            return true;
        }
        catch { return false; }
    }
    public get requestId(): number { return this._requestId; }
    public get snapshot(): RpBusinessSnapshot | null { return this._snapshot; }
}
