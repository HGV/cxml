// This file is part of cxml, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var MemberRefBase_1 = require("./MemberRefBase");
var MemberRef = (function (_super) {
    __extends(MemberRef, _super);
    function MemberRef(spec, namespace, proxy) {
        var _this = this;
        var flags = spec[1];
        var member;
        if (typeof (spec[0]) == 'number')
            member = namespace.memberByNum(spec[0]);
        else
            member = spec[0];
        _this = _super.call(this, member, (flags & MemberRef.optionalFlag) ? 0 : 1, (flags & MemberRef.arrayFlag) ? Infinity : 1) || this;
        _this.safeName = spec[2] || _this.member.safeName;
        if (member.isSubstituted)
            proxy = _this;
        if (proxy && _this.max > 1)
            _this.proxy = proxy;
        return _this;
    }
    return MemberRef;
}(MemberRefBase_1.MemberRefBase));
exports.MemberRef = MemberRef;
