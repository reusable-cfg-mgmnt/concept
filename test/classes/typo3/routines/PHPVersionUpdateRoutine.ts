import {CUDOperation, Routine, RoutineExecution} from "../../../../src/Entity/Routine";
import {Property} from "../../../../src/Entity/Property";

export class VersionUpdateRoutine extends Routine {
    protected context = 'PHP';
    protected operation = CUDOperation.UPDATE;
    protected properties = ['version'];
    protected execution = RoutineExecution.manual;
    protected run(properties: Property[]) {
        // ...
        console.log('Do stuff');
    }
}
export default new VersionUpdateRoutine();