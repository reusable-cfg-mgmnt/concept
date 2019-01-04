import {Property} from "./Property";

export enum RoutineType {
    update = 1,
    create = 2,
    delete = 3
}

export enum RoutineExecution {
    manual = 1,
    automated = 2,
    deployment = 3,
}

export abstract class Routine<T extends RoutineType> {
    protected scope: string = null;
    protected abstract execution: RoutineExecution;
    protected abstract properties: string[];
    protected abstract run(properties: Property[]);
}
