"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const current_1 = require("../controllers/current");
const router = (0, express_1.Router)();
router.get('/current/:location', current_1.getLocationCurrent);
router.get('/current', current_1.getAllCurrent);
exports.default = router;
//# sourceMappingURL=current.js.map