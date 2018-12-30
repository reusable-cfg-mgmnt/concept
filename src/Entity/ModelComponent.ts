export class ModelComponent {
    protected _name: string;
    protected _properties: {[name: string]: string} = {};
    protected _dependencies: string[] = [];

    constructor(name: string, properties: any = {}, dependencies: string[] = []) {
        this._name = name;
        this._properties = properties;
        this._dependencies = dependencies;
    }

    get name(): string {
        return this._name;
    }
    get properties(): any {
        return this._properties;
    }

    get dependencies() {
        return this._dependencies;
    }
}