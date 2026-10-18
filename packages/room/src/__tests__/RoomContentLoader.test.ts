import { FurnitureType, RoomObjectCategory } from '@volt/api';
import { describe, expect, it } from 'vitest';
import { RoomContentLoader } from '../RoomContentLoader';

describe('RoomContentLoader', () =>
{
    it('uses numbered poster names and ignores sticky-note quantity extras', () =>
    {
        const loader = new RoomContentLoader();
        loader.processFurnitureData([
            { type: FurnitureType.WALL, id: 1, className: 'poster', revision: 1 } as any,
            { type: FurnitureType.WALL, id: 2, className: 'post.it.vd', revision: 1 } as any
        ]);
        expect(loader.getFurnitureWallNameForTypeId(1, '2')).toBe('poster2');
        expect(loader.getFurnitureWallNameForTypeId(2, '20')).toBe('post_it_vd');
    });
    it('categorizes indexed-color wall item object names as wall furni', () =>
    {
        const loader = new RoomContentLoader();

        loader.processFurnitureData([
            {
                type: FurnitureType.WALL,
                id: 7,
                className: 'wall_flag*2',
                revision: 1
            } as any
        ]);

        expect(loader.getFurnitureWallNameForTypeId(7)).toBe('wall_flag');
        expect(loader.getCategoryForType('wall_flag')).toBe(RoomObjectCategory.WALL);
    });

    it('prefers wall category when furnidata has duplicate floor and wall class names', () =>
    {
        const loader = new RoomContentLoader();

        loader.processFurnitureData([
            {
                type: FurnitureType.FLOOR,
                id: 21210509,
                className: 'diamond_painting14',
                revision: 59005
            } as any,
            {
                type: FurnitureType.WALL,
                id: 4608,
                className: 'diamond_painting14',
                revision: 58643
            } as any
        ]);

        expect(loader.getFurnitureWallNameForTypeId(4608)).toBe('diamond_painting14');
        expect(loader.getCategoryForType('diamond_painting14')).toBe(RoomObjectCategory.WALL);
    });
});
