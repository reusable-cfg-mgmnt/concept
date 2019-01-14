import * as fs from "fs";
import {ComposedModels} from "../Entity/ComposedModels";
import {Marker} from "../Entity/Marker";
import {Property} from "../Entity/Property";
import * as path from "path";
import {CUDOperation, Routine} from "../Entity/Routine";
import {ModelComponent} from "../Entity/ModelComponent";

export class Processor {
    protected saveDataFile = './data.txt';
    protected mergedGraph: ComposedModels;

    /**
     * Location where the routine executables are stored. [nodename] is replaced by the name of a node in lowercase.
     * @type {string}
     */
    protected classes_dir = path.join(__dirname, '..', '..', 'test', 'classes', '[nodename]', 'routines');

    constructor(model: ComposedModels) {
        const composedModel = model;
        const previousGraphFile = fs.readFileSync(this.saveDataFile, { encoding: 'utf-8'});
        const previousModel = ComposedModels.factory(previousGraphFile);

        if (!this.compare_graphs(previousModel, composedModel)) {
            throw new Error("Topologies of model graphs required to be identical!");
        }

        this.mergedGraph = this.merge_graphs(previousModel, composedModel);

        // console.log(this.find_parent_nodes(this.mergedGraph, 'TYPO3'));
        // this.saveGraph(composedModel);
    }

    // Constructs a new graph based on the input models
    protected merge_graphs(previousModel: ComposedModels, currentModel: ComposedModels) {
        const graph = ComposedModels.factory(currentModel);

        // use topological sort to get the order in which both graphs will be compared
        // note: we assumed that both graph topologies are the same, see method "compare_graphs" in Processor constructor
        // therefore it does not matter which graph we apply .topologicalSort() on
        const order = graph.topologicalSort();

        // In this loop the previous and current values of properties of each node are compared.
        for (const node_name of order) {
            // get arrays of property names to determine if some were added or removed
            const previous_nodepropnames = previousModel.properties.get_property_names(node_name);
            const current_nodepropnames = currentModel.properties.get_property_names(node_name);

            // properties found in previous and current node properties => intersection of both arrays:
            const intersection = previous_nodepropnames.filter(value => -1 !== current_nodepropnames.indexOf(value));
            if (intersection.length > 0) {
                // same properties => add previous property value as left-hand-side value and set <<update>> marker on property if they differ, else set <<noop>> marker
                intersection.forEach((name) => {
                    const affectedProperty = graph.properties.find_by_name(node_name, name);
                    affectedProperty.value.unshift(previousModel.properties.find_by_name(node_name, name).value[0]); // add previous value at the beginning of array
                    if (affectedProperty.value[0] === affectedProperty.value[1]) {
                        affectedProperty.marker = Marker.NOOP;
                    } else {
                        affectedProperty.marker = Marker.UPDATE;
                    }
                });
            }

            // properties found in previous but not in current node properties => difference (previous without current):
            const difference_left = previous_nodepropnames.filter(value => -1 === current_nodepropnames.indexOf(value));
            if (difference_left.length > 0) {
                // properties were removed => add properties again, add empty right-hand-side value and set <<delete>> marker on property
                difference_left.forEach((name) => {
                    const newProperty = new Property(name, [previousModel.properties.find_by_name(node_name, name).value[0], '']);
                    newProperty.marker = Marker.DELETE;
                    graph.properties.map.get(node_name).push(newProperty);
                });
            }

            // properties found in current but not in previous node properties => difference (current without previous):
            const difference_right = current_nodepropnames.filter(value => -1 === previous_nodepropnames.indexOf(value));
            if (difference_right.length > 0) {
                // properties were created => add empty left-hand-side value and set <<create>> marker on property
                // same properties => add previous property value as left-hand-side value and set <<update>> marker on property
                difference_right.forEach((name) => {
                    const affectedProperty = graph.properties.find_by_name(node_name, name);
                    affectedProperty.value.unshift(''); // add empty element at the beginning of array
                    affectedProperty.marker = Marker.CREATE;
                });
            }

            // Set node marker
            const changedProperties = graph.properties.get_changed_properties(node_name);
            if (changedProperties.length) {
                graph.set_node_marker(node_name, Marker.UPDATE); // properties changed -> set <<update>> marker
            } else {
                graph.set_node_marker(node_name, Marker.NOOP); // no changes -> <<noop>> marker
            }
        }
        return graph;
    }

    protected marker_to_string(value): string {
        for (const k in Marker) {
            if (Marker[k] !== value) {
                continue;
            }
            return k;
        }
        return null;
    }

    protected node_dfs(nodeName, path = []) {
        const stack = this.mergedGraph.adjacent(nodeName); // expand node, i.e. return all children
        while (stack.length) {
            const currentNode = stack.pop();
            path.push(currentNode);
            this.node_dfs(currentNode, path);
        }
        return path;
    }

    protected get_routines(nodeName: string) {
        const directory = this.classes_dir.replace('[nodename]', nodeName.toLowerCase());
        const routines: Routine[] = [];
        fs.readdirSync(directory).forEach((file) => {
            if (file.endsWith('.js')) {
                const routine = require(path.join(directory, file)).default;
                routines.push( routine );
            }
        });
        return routines;
    }

    protected marker_to_operation(marker: Marker) {
        switch (marker) {
            case Marker.CREATE:
                return CUDOperation.CREATE;
            case Marker.UPDATE:
                return CUDOperation.UPDATE;
            case Marker.DELETE:
                return CUDOperation.DELETE;
            default:
                throw new Error('Unable to transform marker ' + marker + ' into a routine operation.');
        }
    }

    /**
     *
     * @param {string} nodeName
     * @param {Property[]} changes
     * @param {string} context
     * @param {boolean} fetch_all - fetches all routines if set to true. if set to false only fetches one routine
     * @returns {Routine[]}
     */
    protected get_routines_for_change(nodeName: string, changes: Property[], context: string = null, fetch_all = true) {
       const routines: Routine[] = [];
        for (const routine of this.get_routines(nodeName)) {
            for (const change of changes) {
                const operation = this.marker_to_operation(change.marker) as CUDOperation;
                if (
                    routine.getOperation() === operation && // same operation
                    routine.getProperties().indexOf(change.name) !== -1 && // same property name
                    routine.getContext() === context // correct context
                ) {
                    routines.push(routine);
                    if (!fetch_all) {
                        break;
                    }
                }
            }
            if (!fetch_all && routines.length) {
                break; // skip checking remaining changes as we only care if any property has been changed
            }
        }
        return routines;
    }

    /**
     * This method finds all nodes that are affected by property changes on a given node
     * @param {string} nodeName name of the node where the change occurred
     * @param {Property[]} changes node properties that were changed (with marker set!)
     * @returns {string[]}
     */
    protected get_affected_nodes(nodeName: string, changes: Property[]) {
        // Get all potentially affected nodes (= all sub nodes)
        const potentially_affected = this.node_dfs(nodeName);

        // Check for all potentially affected nodes if a routine was defined for any changed property with the same operation
        const really_affected: string[] = [];
        for (const node of potentially_affected) {
            // Fetch a maximum of one routine (fetch_all=false) defined for "node" in context "nodeName"
            if (this.get_routines_for_change(node, changes, nodeName, false).length) {
                really_affected.push(node);
            }
        }
        return really_affected;
    }

    /**
     * Prints changes that were made to node properties
     */
    public print_changes() {
        this.mergedGraph.properties.map.forEach((value, key) => {
            const node_marker = this.mergedGraph.get_node_marker(key);
            console.log('[' + this.marker_to_string(node_marker) + '] Node ' + key + ':');
            const changed = this.mergedGraph.properties.get_changed_properties(key);
            if (!changed.length) {
                console.log('- No changes');
                return;
            }
            changed.forEach((property) => {
               console.log('- [' + this.marker_to_string(property.marker) + '] ' + property.name + ': \'' + property.value[0] + '\' => \'' + property.value[1] + '\'');
            });
            let affected_nodes = this.get_affected_nodes(key, changed);
            console.log("\n Also affected: " + affected_nodes);
        });
    }

    /**
     * Verifies that both model graphs are topologically identical
     */
    protected compare_graphs(graphA: ComposedModels, graphB: ComposedModels) {
        const sortedA = graphA.topologicalSort();
        const sortedB = graphB.topologicalSort();
        return JSON.stringify(sortedA) === JSON.stringify(sortedB);
    }

    find_parent_nodes(graph: ComposedModels, node) {
        const output = [];
        graph.topologicalSort().forEach((edge) => {
            if (graph.adjacent(edge).indexOf(node) !== -1) {
                output.push(edge);
            }
        });
        return output;
    }

    public saveGraph(composedModel) {
        fs.writeFileSync(this.saveDataFile, JSON.stringify( composedModel.serialize() ));
    }
}