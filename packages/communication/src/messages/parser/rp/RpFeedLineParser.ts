import { IMessageDataWrapper, IMessageParser } from '@volt/api';

const NAME_LENGTH = 40;
const DETAIL_LENGTH = 80;
// 0 shot kill, 1 melee kill, 2 wanted, 3 bounty, 4 arrested.
const LAST_KIND = 4;
const hasTarget = (kind: number): boolean => kind === 0 || kind === 1 || kind === 3;

// 6130: one city-wide roleplay log line. The server names both players; the client only words the kind.
export class RpFeedLineParser implements IMessageParser
{
    private _kind = 0;
    private _actorName = '';
    private _targetName = '';
    private _detail = '';

    public flush(): boolean
    {
        this._kind = 0;
        this._actorName = '';
        this._targetName = '';
        this._detail = '';
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper) return false;
        try
        {
            if(this.readLine(wrapper)) return true;
        }
        catch
        {
            // a truncated packet is rejected like any other malformed one
        }
        this.flush();
        return false;
    }

    private readLine(wrapper: IMessageDataWrapper): boolean
    {
        const kind = wrapper.readInt();
        const actorName = wrapper.readString();
        const targetName = wrapper.readString();
        const detail = wrapper.readString();
        if(wrapper.bytesAvailable) return false;
        if(!Number.isInteger(kind) || kind < 0 || kind > LAST_KIND) return false;
        if(typeof actorName !== 'string' || actorName.length < 1 || actorName.length > NAME_LENGTH) return false;
        if(typeof targetName !== 'string' || targetName.length > NAME_LENGTH || hasTarget(kind) !== (targetName.length > 0)) return false;
        if(typeof detail !== 'string' || detail.length > DETAIL_LENGTH) return false;
        if(kind === 3 && !/^[1-9]\d{0,9}$/.test(detail)) return false;
        this._kind = kind;
        this._actorName = actorName;
        this._targetName = targetName;
        this._detail = detail;
        return true;
    }

    public get kind(): number { return this._kind; }
    public get actorName(): string { return this._actorName; }
    public get targetName(): string { return this._targetName; }
    public get detail(): string { return this._detail; }
}
