import {Processor} from "./Processor/Processor";
import {ModelComponent} from "./Entity/ModelComponent";
import {ComposedModels} from "./Entity/ComposedModels";

const php = new ModelComponent('PHP', { version: 'some-reference', newProperty: 'some-reference' });
const typo3 = new ModelComponent('TYPO3', { version: 'some-reference2' }, ['PHP']);

// Compose model components into a ComposedModels
const graph = ComposedModels.factory([typo3, php]);

// process new model
const processor = new Processor(graph);
processor.print_changes();
// console.log(graph.topologicalSort());
// modelComposer.saveGraph();