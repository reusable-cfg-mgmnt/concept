import {Marker} from "./Marker";

export class Property {
    protected _name: string;
    protected _value: string[] = [];
    protected _marker: Marker = null;
    constructor(name: string, value: string|string[]) {
        this._name = name;
        if (typeof value === "string") {
            this._value.push(value);
        } else {
            this._value = value;
        }
    }

    get name(): string {
        return this._name;
    }

    get value(): string[] {
        return this._value;
    }

    set value(value: string[]) {
        this._value = value;
    }

    get marker(): Marker {
        return this._marker;
    }

    set marker(value: Marker) {
        this._marker = value;
    }
}