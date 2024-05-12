"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJsonAttributeSourceConfiguration = exports.JsonAttributesSourceConfiguration = void 0;
function unsupportedSource(attributesSource) {
    throw new Error(`Unsupported JSON attributes source: ${attributesSource}`);
}
class JsonAttributesSourceConfiguration {
    constructor(namespace, propertyAttribute, requiredAttribute) {
        this.namespace = namespace;
        this.propertyAttribute = propertyAttribute;
        this.requiredAttribute = requiredAttribute;
    }
}
exports.JsonAttributesSourceConfiguration = JsonAttributesSourceConfiguration;
const newtonsoftConfiguration = new JsonAttributesSourceConfiguration('Newtonsoft.Json', 'JsonProperty', 'JsonRequired');
// System.Text.Json does not have support of `JsonRequired` alternative (as for .NET 5)
const systemTextJsonConfiguration = new JsonAttributesSourceConfiguration('System.Text.Json.Serialization', 'JsonPropertyName', "Required");
function getJsonAttributeSourceConfiguration(attributesSource) {
    switch (attributesSource) {
        case 'Newtonsoft.Json':
            return newtonsoftConfiguration;
        case 'System.Text.Json':
            return systemTextJsonConfiguration;
    }
    unsupportedSource(attributesSource);
}
exports.getJsonAttributeSourceConfiguration = getJsonAttributeSourceConfiguration;
//# sourceMappingURL=json-attributes.js.map