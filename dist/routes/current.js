"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_1 = require("../lib/data");
const router = (0, express_1.Router)();
router.get('/history/:location', data_1.getCurrentData);
exports.default = router;
//# sourceMappingURL=current.js.map