import {Processor} from "./Processor/Processor";
import {ComposedModels} from "./Entity/ComposedModels";

// Load file with all available components
ComposedModels.init();

// Compose model components into a ComposedModels
const graph = ComposedModels.factory(['TYPO3', 'PHP']);

// process new model
const processor = new Processor(graph);
processor.print_changes();
// console.log(graph.topologicalSort());
// modelComposer.saveGraph();