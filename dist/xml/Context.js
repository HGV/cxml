// This file is part of cxml, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ContextBase_1 = require("./ContextBase");
var Namespace_1 = require("./Namespace");
var TypeSpec_1 = require("./TypeSpec");
var Member_1 = require("./Member");
/** Create types and members based on JSON specifications. */
function defineSpecs(pendingList) {
    for (var _i = 0, pendingList_1 = pendingList; _i < pendingList_1.length; _i++) {
        var spec = pendingList_1[_i];
        // If the spec has a parent, it handles defining the child.
        if (!spec.item.parent || spec.item.parent == spec) {
            spec.item.define();
        }
    }
}
/** XML parser context, holding definitions of all imported namespaces. */
var Context = (function (_super) {
    __extends(Context, _super);
    function Context() {
        var _this = _super.call(this, Namespace_1.Namespace) || this;
        /** List of pending namespaces (not yet registered or waiting for processing). */
        _this.pendingNamespaceList = [];
        /** Grows with pendingNamespaceList and shrinks when namespaces are registered.
          * When zero, all pending namespaces have been registered and can be processed. */
        _this.pendingNamespaceCount = 0;
        _this.pendingTypeList = [];
        _this.pendingMemberList = [];
        _this.typeList = [];
        return _this;
    }
    /** Mark a namespace as seen and add it to list of pending namespaces. */
    Context.prototype.markNamespace = function (exportObj) {
        this.pendingNamespaceList.push(exportObj);
        ++this.pendingNamespaceCount;
    };
    /** Parse types from schema in serialized JSON format. */
    Context.prototype.registerTypes = function (namespace, exportTypeNameList, rawTypeSpecList) {
        var exportTypeCount = exportTypeNameList.length;
        var typeCount = rawTypeSpecList.length;
        var typeName;
        for (var typeNum = 0; typeNum < typeCount; ++typeNum) {
            var rawSpec = rawTypeSpecList[typeNum];
            if (typeNum > 0 && typeNum <= exportTypeCount) {
                typeName = exportTypeNameList[typeNum - 1];
            }
            else
                typeName = null;
            var typeSpec = new TypeSpec_1.TypeSpec(rawSpec, namespace, typeName);
            namespace.addType(typeSpec);
            this.pendingTypeList.push(typeSpec);
            this.typeList.push(typeSpec);
        }
    };
    /** Parse members from schema in serialized JSON format. */
    Context.prototype.registerMembers = function (namespace, rawMemberSpecList) {
        for (var _i = 0, rawMemberSpecList_1 = rawMemberSpecList; _i < rawMemberSpecList_1.length; _i++) {
            var rawSpec = rawMemberSpecList_1[_i];
            var memberSpec = new Member_1.MemberSpec(rawSpec, namespace);
            namespace.addMember(memberSpec);
            this.pendingMemberList.push(memberSpec);
        }
    };
    /** Process namespaces seen so far. */
    Context.prototype.process = function () {
        // Start only when process has been called for all namespaces.
        if (--this.pendingNamespaceCount > 0)
            return;
        // Link types to their parents.
        for (var _i = 0, _a = this.pendingNamespaceList; _i < _a.length; _i++) {
            var exportObj = _a[_i];
            var namespace = exportObj._cxml[0];
            namespace.link();
        }
        // Create classes for all types.
        // This is effectively Kahn's algorithm for topological sort
        // (the rest is in the TypeSpec class).
        defineSpecs(this.pendingTypeList);
        defineSpecs(this.pendingMemberList);
        for (var _b = 0, _c = this.pendingTypeList; _b < _c.length; _b++) {
            var typeSpec = _c[_b];
            typeSpec.defineMembers();
        }
        this.pendingTypeList = [];
        this.pendingMemberList = [];
        for (var _d = 0, _e = this.pendingNamespaceList; _d < _e.length; _d++) {
            var exportObject = _e[_d];
            var namespace = exportObject._cxml[0];
            namespace.exportTypes(exportObject);
            namespace.exportDocument(exportObject);
        }
        this.pendingNamespaceList = [];
    };
    /** Remove temporary structures needed to define new handlers. */
    Context.prototype.cleanPlaceholders = function (strict) {
        for (var _i = 0, _a = this.namespaceList; _i < _a.length; _i++) {
            var namespace = _a[_i];
            namespace.importSpecList = null;
            namespace.exportTypeNameList = null;
            namespace.typeSpecList = null;
            namespace.memberSpecList = null;
            namespace.exportTypeTbl = null;
            namespace.exportMemberTbl = null;
        }
        for (var _b = 0, _c = this.typeList; _b < _c.length; _b++) {
            var typeSpec = _c[_b];
            typeSpec.cleanPlaceholders(strict);
        }
        this.typeList = null;
    };
    return Context;
}(ContextBase_1.ContextBase));
exports.Context = Context;