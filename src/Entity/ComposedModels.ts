import * as GraphDS from "graph-data-structure";
import {Property} from "./Property";
import {PropertyMap} from "./PropertyMap";
import {Marker} from "./Marker";
import * as fs from "fs";
import {ModelComponent} from "./ModelComponent";
import YAML from 'yaml';

/**
 * This class combines the given functionalities of the graph-data-structure with custom requirements (node properties).
 */
export class ComposedModels {
    /**
     * graph-data-structure has no TypeScript typings therefore we can't extend it so we store it as a property
     */
    protected _graph = new GraphDS();

    protected _nodeProperties = new PropertyMap(new Map<string, Property[]>()); // Maps a nodeName to its properties

    protected _nodeMarkers = new Map<string, Marker>();

    protected static allComponents: ModelComponent[] = [];
    public static init() {
        const file = fs.readFileSync('./all_components.yaml', 'utf8');
        const components = YAML.parse(file);
        for (const component_key in components) {
            if (!components.hasOwnProperty(component_key)) {
                continue;
            }

            // Transform array of properties into object of properties
            const properties = {};
            for (const property of components[component_key].properties) {
                Object.assign(properties, ...property);
            }

            // Pass dependencies if set
            let dependencies = [];
            if (components[component_key].hasOwnProperty('dependencies')) {
                dependencies = components[component_key].dependencies;
            }
            this.allComponents.push(new ModelComponent(component_key, properties, dependencies));
        }
    }

    public get_node_marker(nodeName: string): Marker {
        return this._nodeMarkers.get(nodeName);
    }

    public set_node_marker(nodeName: string, marker: Marker) {
        this._nodeMarkers.set(nodeName, marker);
    }

    public get properties() {
        return this._nodeProperties;
    }

    public serialize() {
        // save node properties
        const serialized = this._graph.serialize();
        for (let node of serialized.nodes) {
            node.properties = {};
            if (this._nodeProperties.map.has(node.id)) {
                node.properties[node.id] = this._nodeProperties.map.get(node.id);
            }
        }
        return serialized;
    }

    public addNode(nodeName: string) {
        return this._graph.addNode(nodeName);
    }

    public addEdge(from: string, to: string) {
        return this._graph.addEdge(from, to);
    }

    public topologicalSort() {
        return this._graph.topologicalSort();
    }

    public adjacent(edge: string) {
        return this._graph.adjacent(edge);
    }

    public static deserialize(graphString: string) {
        const model = new ComposedModels();
        const parsedString = JSON.parse(graphString);
        model._graph = GraphDS().deserialize(parsedString);
        // set properties
        for (const node of parsedString.nodes) {
            this.set_node_properties(model, node.id, node.properties);
        }
        return model;
    }

    protected static set_node_properties(target: ComposedModels, node_name, properties) {
        if (!target._nodeProperties.map.has(node_name)) {
            const node_properties = [];
            for (const prop_key in properties) {
                if (!properties.hasOwnProperty(prop_key)) {
                    continue;
                }
                node_properties.push(new Property(prop_key, properties[prop_key]))
            }
            target._nodeProperties.map.set(node_name, node_properties);
        }
    }

    protected static resolve_property(propertyReference: string): string {
        if (propertyReference === 'some-reference') {
            return 'test1';
        } else if (propertyReference === 'some-reference2') {
            return 'test2';
        }
    }

    protected static create_from_array(array: string[]) {
        const componentObjs = this.allComponents.filter((component => array.indexOf(component.name) !== -1)); // array
        const model = new ComposedModels();
        let name;
        for (let listElement of componentObjs) {
            name = listElement.name;
            // Set node
            model._graph.addNode(name);

            // Resolve node property values
            const properties = {};
            for (const propertyName in listElement.properties) {
                if (!listElement.properties.hasOwnProperty(propertyName)) {
                    continue;
                }
                properties[propertyName] = this.resolve_property(listElement.properties[propertyName]);
            }
            this.set_node_properties(model, name, properties);

            // Set edges
            for (let dependency of listElement.dependencies) {
                if (array.indexOf(dependency) === -1) {
                    // Dependency not found in input array which is mandatory!
                    throw new Error('The component ' + name + ' depends on ' + dependency + ' which is missing in the list.');
                }
                console.debug('Setting edge from ' + dependency + ' to ' + name);
                model._graph.addEdge(dependency, name);
            }
        }
        return model;
    }

    protected static create_from_copy(src: ComposedModels) {
        const graph = new ComposedModels();
        graph._graph = src._graph;
        graph._nodeProperties = src._nodeProperties;
        return graph;
    }

    public static factory(data: string|string[]|ComposedModels): ComposedModels {
        if (typeof data === "string") { // create from save file (predecessor graph G)
            return ComposedModels.deserialize( data );
        } else if (data instanceof ComposedModels) { // create as copy (constructing graph H)
            return this.create_from_copy(data);
        } else if (data instanceof Array) { // successor graph G'
            return this.create_from_array(data);
        }
    }
}