export enum RoutineType {
    update = 1,
    create = 2,
    delete = 3
}

export abstract class Routine<T extends RoutineType> {
    protected scope: string;
    protected abstract run();
}
