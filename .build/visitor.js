"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSharpResolversVisitor = void 0;
const assert_1 = __importDefault(require("assert"));
const change_case_all_1 = require("change-case-all");
const graphql_1 = require("graphql");
const c_sharp_common_1 = require("@graphql-codegen/c-sharp-common");
const visitor_plugin_common_1 = require("@graphql-codegen/visitor-plugin-common");
const json_attributes_1 = require("./json-attributes");
class CSharpResolversVisitor extends visitor_plugin_common_1.BaseVisitor {
    constructor(rawConfig, _schema) {
        var _a;
        super(rawConfig, {
            enumValues: rawConfig.enumValues || {},
            listType: rawConfig.listType || 'List',
            namespaceName: rawConfig.namespaceName || 'GraphQLCodeGen',
            className: rawConfig.className || 'Types',
            emitRecords: rawConfig.emitRecords || false,
            emitJsonAttributes: (_a = rawConfig.emitJsonAttributes) !== null && _a !== void 0 ? _a : true,
            jsonAttributesSource: rawConfig.jsonAttributesSource || 'Newtonsoft.Json',
            scalars: (0, visitor_plugin_common_1.buildScalarsFromConfig)(_schema, rawConfig, c_sharp_common_1.C_SHARP_SCALARS),
        });
        this._schema = _schema;
        if (this._parsedConfig.emitJsonAttributes) {
            this.jsonAttributesConfiguration = (0, json_attributes_1.getJsonAttributeSourceConfiguration)(this._parsedConfig.jsonAttributesSource);
        }
    }
    getImports() {
        const allImports = [
            'System',
            'System.Collections.Generic',
        ];
        if (this._parsedConfig.emitJsonAttributes) {
            (0, assert_1.default)(this.jsonAttributesConfiguration);
            const jsonAttributesNamespace = this.jsonAttributesConfiguration.namespace;
            allImports.push(jsonAttributesNamespace);
        }
        return allImports.map(i => `using ${i};`).join('\n') + '\n';
    }
    wrapWithNamespace(content) {
        return new c_sharp_common_1.CSharpDeclarationBlock()
            .asKind('namespace')
            .withName(this.config.namespaceName)
            .withBlock((0, visitor_plugin_common_1.indentMultiline)(content)).string;
    }
    wrapWithClass(content) {
        return new c_sharp_common_1.CSharpDeclarationBlock()
            .access('public')
            .asKind('class')
            .withName((0, c_sharp_common_1.convertSafeName)(this.config.className))
            .withBlock((0, visitor_plugin_common_1.indentMultiline)(content)).string;
    }
    getEnumValue(enumName, enumOption) {
        if (typeof this.config.enumValues === 'object' &&
            this.config.enumValues[enumName] &&
            typeof this.config.enumValues[enumName] === 'object' &&
            this.config.enumValues[enumName][enumOption]) {
            return this.config.enumValues[enumName][enumOption];
        }
        return enumOption;
    }
    EnumValueDefinition(node) {
        return (enumName) => {
            const enumHeader = this.getFieldHeader(node);
            const enumOption = (0, c_sharp_common_1.convertSafeName)(node.name);
            return enumHeader + (0, visitor_plugin_common_1.indent)(this.getEnumValue(enumName, enumOption));
        };
    }
    EnumTypeDefinition(node) {
        var _a;
        const enumName = this.convertName(node.name);
        const enumValues = (node.values || [])
            .map(enumValue => enumValue(node.name.value))
            .join(',\n');
        const enumBlock = [enumValues].join('\n');
        return new c_sharp_common_1.CSharpDeclarationBlock()
            .access('public')
            .asKind('enum')
            .withComment((_a = node.description) !== null && _a !== void 0 ? _a : "")
            .withName(enumName)
            .withBlock(enumBlock).string;
    }
    getFieldHeader(node, fieldType) {
        var _a, _b, _c;
        const attributes = [];
        const commentText = (0, c_sharp_common_1.transformComment)((_b = (_a = node.description) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : "");
        const deprecationDirective = (node.directives || []).find(v => { var _a; return ((_a = v.name) === null || _a === void 0 ? void 0 : _a.value) === 'deprecated'; });
        if (deprecationDirective) {
            const deprecationReason = this.getDeprecationReason(deprecationDirective);
            attributes.push(`[Obsolete("${deprecationReason}")]`);
        }
        if (this._parsedConfig.emitJsonAttributes && node.kind === graphql_1.Kind.FIELD_DEFINITION) {
            (0, assert_1.default)(this.jsonAttributesConfiguration);
            const jsonPropertyAttribute = this.jsonAttributesConfiguration.propertyAttribute;
            if (jsonPropertyAttribute != null) {
                attributes.push(`[${jsonPropertyAttribute}("${node.name.value}")]`);
            }
        }
        if (node.kind === graphql_1.Kind.INPUT_VALUE_DEFINITION && ((_c = fieldType === null || fieldType === void 0 ? void 0 : fieldType.isOuterTypeRequired) !== null && _c !== void 0 ? _c : false)) {
            // Should be always inserted for required fields to use in `GetInputObject()` when JSON attributes are not used
            // or there are no JSON attributes in selected attribute source that provides `JsonRequired` alternative
            // attributes.push('[Required]');
            if (this._parsedConfig.emitJsonAttributes) {
                (0, assert_1.default)(this.jsonAttributesConfiguration);
                const jsonRequiredAttribute = this.jsonAttributesConfiguration.requiredAttribute;
                if (jsonRequiredAttribute != null) {
                    attributes.push(`[${jsonRequiredAttribute}]`);
                }
            }
        }
        if (commentText || attributes.length > 0) {
            const summary = commentText ? (0, visitor_plugin_common_1.indentMultiline)(commentText.trimRight()) + '\n' : '';
            const attributeLines = attributes.length > 0
                ? attributes
                    .map(attr => (0, visitor_plugin_common_1.indent)(attr))
                    .concat('')
                    .join('\n')
                : '';
            return summary + attributeLines;
        }
        return '';
    }
    getDeprecationReason(directive) {
        if (directive.name.value !== 'deprecated') {
            return '';
        }
        const args = directive.arguments || [];
        const hasArguments = args.length > 0;
        let reason = 'Field no longer supported';
        if (hasArguments && args[0].value.kind === graphql_1.Kind.STRING) {
            reason = args[0].value.value;
        }
        return reason;
    }
    resolveInputFieldType(typeNode, hasDefaultValue = false) {
        const innerType = (0, visitor_plugin_common_1.getBaseTypeNode)(typeNode);
        const schemaType = this._schema.getType(innerType.name.value);
        const listType = (0, c_sharp_common_1.getListTypeField)(typeNode);
        const required = (0, c_sharp_common_1.getListInnerTypeNode)(typeNode).kind === graphql_1.Kind.NON_NULL_TYPE;
        let result = null;
        if ((0, graphql_1.isScalarType)(schemaType)) {
            if (this.scalars[schemaType.name]) {
                const baseType = this.scalars[schemaType.name];
                result = new c_sharp_common_1.CSharpFieldType({
                    baseType: {
                        type: baseType,
                        required,
                        valueType: (0, c_sharp_common_1.isValueType)(baseType),
                    },
                    listType,
                });
            }
            else {
                result = new c_sharp_common_1.CSharpFieldType({
                    baseType: {
                        type: 'object',
                        required,
                        valueType: false,
                    },
                    listType,
                });
            }
        }
        else if ((0, graphql_1.isInputObjectType)(schemaType)) {
            result = new c_sharp_common_1.CSharpFieldType({
                baseType: {
                    type: `${this.convertName(schemaType.name)}`,
                    required,
                    valueType: false,
                },
                listType,
            });
        }
        else if ((0, graphql_1.isEnumType)(schemaType)) {
            result = new c_sharp_common_1.CSharpFieldType({
                baseType: {
                    type: this.convertName(schemaType.name),
                    required,
                    valueType: true,
                },
                listType,
            });
        }
        else {
            (0, assert_1.default)(schemaType != null);
            result = new c_sharp_common_1.CSharpFieldType({
                baseType: {
                    type: `${schemaType.name}`,
                    required,
                    valueType: false,
                },
                listType,
            });
        }
        if (hasDefaultValue) {
            // Required field is optional when default value specified, see #4273
            (result.listType || result.baseType).required = false;
        }
        return result;
    }
    buildRecord(name, description, inputValueArray, interfaces) {
        var _a;
        const classSummary = (0, c_sharp_common_1.transformComment)((_a = description === null || description === void 0 ? void 0 : description.value) !== null && _a !== void 0 ? _a : '');
        const interfaceImpl = interfaces && interfaces.length > 0
            ? ` : ${interfaces.map(ntn => ntn.name.value).join(', ')}`
            : '';
        const recordMembers = (inputValueArray || [])
            .map(arg => {
            const fieldType = this.resolveInputFieldType(arg.type);
            const fieldHeader = this.getFieldHeader(arg, fieldType);
            const fieldName = (0, c_sharp_common_1.convertSafeName)((0, change_case_all_1.pascalCase)(this.convertName(arg.name)));
            const csharpFieldType = (0, c_sharp_common_1.wrapFieldType)(fieldType, fieldType.listType, this.config.listType);
            return (fieldHeader +
                (0, visitor_plugin_common_1.indent)(`public ${csharpFieldType} ${fieldName} { get; init; } = ${fieldName};`));
        })
            .join('\n\n');
        const recordInitializer = (inputValueArray || [])
            .map(arg => {
            const fieldType = this.resolveInputFieldType(arg.type);
            const fieldName = (0, c_sharp_common_1.convertSafeName)((0, change_case_all_1.pascalCase)(this.convertName(arg.name)));
            const csharpFieldType = (0, c_sharp_common_1.wrapFieldType)(fieldType, fieldType.listType, this.config.listType);
            return `${csharpFieldType} ${fieldName}`;
        })
            .join(', ');
        return `
${classSummary}public record ${(0, c_sharp_common_1.convertSafeName)(name)}(${recordInitializer})${interfaceImpl} {
${recordMembers}
}
`;
    }
    buildClass(name, description, inputValueArray, interfaces) {
        var _a;
        const classSummary = (0, c_sharp_common_1.transformComment)((_a = description === null || description === void 0 ? void 0 : description.value) !== null && _a !== void 0 ? _a : '');
        const interfaceImpl = interfaces && interfaces.length > 0
            ? ` : ${interfaces.map(ntn => ntn.name.value).join(', ')}`
            : '';
        const classMembers = (inputValueArray || [])
            .map(arg => {
            const fieldType = this.resolveInputFieldType(arg.type);
            const fieldHeader = this.getFieldHeader(arg, fieldType);
            const fieldName = (0, c_sharp_common_1.convertSafeName)(arg.name);
            const csharpFieldType = (0, c_sharp_common_1.wrapFieldType)(fieldType, fieldType.listType, this.config.listType);
            return fieldHeader + (0, visitor_plugin_common_1.indent)(`public ${csharpFieldType} ${fieldName} { get; set; }`);
        })
            .join('\n\n');
        return `
${classSummary}public class ${(0, c_sharp_common_1.convertSafeName)(name)}${interfaceImpl} {
${classMembers}
}
`;
    }
    buildInterface(name, description, inputValueArray) {
        var _a;
        const classSummary = (0, c_sharp_common_1.transformComment)((_a = description === null || description === void 0 ? void 0 : description.value) !== null && _a !== void 0 ? _a : '');
        const classMembers = (inputValueArray || [])
            .map(arg => {
            const fieldType = this.resolveInputFieldType(arg.type);
            const fieldHeader = this.getFieldHeader(arg, fieldType);
            let fieldName;
            let getterSetter;
            if (this.config.emitRecords) {
                // record
                fieldName = (0, c_sharp_common_1.convertSafeName)((0, change_case_all_1.pascalCase)(this.convertName(arg.name)));
                getterSetter = '{ get; }';
            }
            else {
                // class
                fieldName = (0, c_sharp_common_1.convertSafeName)(arg.name);
                getterSetter = '{ get; set; }';
            }
            const csharpFieldType = (0, c_sharp_common_1.wrapFieldType)(fieldType, fieldType.listType, this.config.listType);
            return fieldHeader + (0, visitor_plugin_common_1.indent)(`${csharpFieldType} ${fieldName} ${getterSetter}`);
        })
            .join('\n\n');
        return `
${classSummary}public interface ${(0, c_sharp_common_1.convertSafeName)(name)} {
${classMembers}
}`;
    }
    buildInputTransformer(name, description, inputValueArray) {
        var _a, _b;
        const classSummary = (0, c_sharp_common_1.transformComment)((_a = description === null || description === void 0 ? void 0 : description.value) !== null && _a !== void 0 ? _a : '');
        const classMembers = (inputValueArray || [])
            .map(arg => {
            const fieldType = this.resolveInputFieldType(arg.type, !!arg.defaultValue);
            const fieldHeader = this.getFieldHeader(arg, fieldType);
            const fieldName = (0, c_sharp_common_1.convertSafeName)(arg.name);
            const csharpFieldType = (0, c_sharp_common_1.wrapFieldType)(fieldType, fieldType.listType, this.config.listType);
            return fieldHeader + (0, visitor_plugin_common_1.indent)(`public ${csharpFieldType} ${fieldName} { get; set; }`);
        })
            .join('\n\n');
        return `
${classSummary}public class ${(0, c_sharp_common_1.convertSafeName)(name)} {
${classMembers}

  public dynamic GetInputObject()
  {
    IDictionary<string, object> d = new System.Dynamic.ExpandoObject();

    var properties = GetType().GetProperties(System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public);
    foreach (var propertyInfo in properties)
    {
      var value = propertyInfo.GetValue(this);
      var defaultValue = propertyInfo.PropertyType.IsValueType ? Activator.CreateInstance(propertyInfo.PropertyType) : null;
${this._parsedConfig.emitJsonAttributes &&
            ((_b = this.jsonAttributesConfiguration) === null || _b === void 0 ? void 0 : _b.requiredAttribute) != null
            ? `
      var requiredProp = propertyInfo.GetCustomAttributes(typeof(${this.jsonAttributesConfiguration.requiredAttribute}Attribute), false).Length > 0;
`
            : `
      var requiredProp = propertyInfo.GetCustomAttributes(typeof(RequiredAttribute), false).Length > 0;
`}
      if (requiredProp || value != defaultValue)
      {
        d[propertyInfo.Name] = value;
      }
    }
    return d;
  }
}
`;
    }
    InputObjectTypeDefinition(node) {
        const name = `${this.convertName(node)}`;
        return this.buildInputTransformer(name, node.description, node.fields);
    }
    ObjectTypeDefinition(node) {
        if (this.config.emitRecords) {
            return this.buildRecord(node.name.value, node.description, node.fields, node.interfaces);
        }
        return this.buildClass(node.name.value, node.description, node.fields, node.interfaces);
    }
    InterfaceTypeDefinition(node) {
        return this.buildInterface(node.name.value, node.description, node.fields);
    }
}
exports.CSharpResolversVisitor = CSharpResolversVisitor;
//# sourceMappingURL=visitor.js.map