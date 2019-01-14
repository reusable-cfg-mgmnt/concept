import {Property} from "./Property";

/**
 * Integer assignment corresponds to Marker class
 */
export enum CUDOperation {
    CREATE = 1,
    DELETE = 2,
    UPDATE = 3,
}

export enum RoutineExecution {
    manual = 1,
    automated = 2,
    deployment = 3,
}

export abstract class Routine {
    protected context: string = null;
    protected abstract execution: RoutineExecution;
    protected abstract properties: string[];
    protected abstract operation: CUDOperation;
    protected abstract run(properties: Property[]);

    public getOperation() {
        return this.operation;
    }

    public getProperties() {
        return this.properties;
    }

    public getContext() {
        return this.context;
    }
}
