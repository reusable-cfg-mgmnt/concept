import {Property} from "./Property";
import {Marker} from "./Marker";

export class PropertyMap {
    /**
     * Store map in property as we can't extend native Map object
     * @see https://github.com/Microsoft/TypeScript/issues/10853
     */
    protected _map: Map<string, Property[]>;

    constructor(map: Map<string, Property[]>) {
        this._map = map;
    }

    public get map() {
        return this._map;
    }

    public find_by_name(nodeName: string, propertyName: string): Property {
        const filtered = this._map.get(nodeName).filter((property) => property.name === propertyName);
        if (!filtered.length) {
            return null;
        }
        return filtered[0];
    }

    public get_property_names(nodeName: string): string[] {
        return this._map.get(nodeName).map((property) => property.name);
    }

    public get_changed_properties(nodeName: string) {
        return this._map.get(nodeName).filter((property) => property.marker !== Marker.NOOP);
    }
}