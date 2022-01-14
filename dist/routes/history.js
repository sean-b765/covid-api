"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const history_1 = require("../controllers/history");
const router = (0, express_1.Router)();
router.get('/history/:location', history_1.getHistoricalData);
exports.default = router;
//# sourceMappingURL=history.js.map