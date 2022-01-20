"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const helpers_1 = require("../lib/helpers");
const router = (0, express_1.Router)();
router.get('/history/:location', helpers_1.getCurrentData);
exports.default = router;
//# sourceMappingURL=current.js.map