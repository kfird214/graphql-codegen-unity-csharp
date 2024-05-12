"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const plugin_helpers_1 = require("@graphql-codegen/plugin-helpers");
const visitor_js_1 = require("./visitor.js");
const plugin = async (schema, documents, config) => {
    const visitor = new visitor_js_1.CSharpResolversVisitor(config, schema);
    const astNode = (0, plugin_helpers_1.getCachedDocumentNodeFromSchema)(schema);
    const visitorResult = (0, plugin_helpers_1.oldVisit)(astNode, { leave: visitor });
    const imports = visitor.getImports();
    const blockContent = visitorResult.definitions.filter((d) => typeof d === 'string').join('\n');
    const wrappedBlockContent = visitor.wrapWithClass(blockContent);
    const wrappedContent = visitor.wrapWithNamespace(wrappedBlockContent);
    return [imports, wrappedContent].join('\n');
};
exports.plugin = plugin;
//# sourceMappingURL=index.js.map