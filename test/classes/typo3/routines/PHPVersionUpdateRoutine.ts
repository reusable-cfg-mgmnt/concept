import {Routine, RoutineExecution, RoutineType} from "../../../../src/Entity/Routine";
import {Property} from "../../../../src/Entity/Property";

export class VersionUpdateRoutine extends Routine<RoutineType.update> {
    protected scope = 'PHP';
    protected properties = ['version'];
    protected execution = RoutineExecution.manual;
    protected run(properties: Property[]) {
        // ...
        console.log('Do stuff');
    }
}