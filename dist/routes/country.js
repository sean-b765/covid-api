"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const country_1 = require("../controllers/country");
const router = (0, express_1.Router)();
router.get('/country/:countryName', country_1.getCountryData);
exports.default = router;
//# sourceMappingURL=country.js.map