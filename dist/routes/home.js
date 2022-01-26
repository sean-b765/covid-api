"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const countryCodes_1 = __importDefault(require("../lib/countryCodes"));
const router = (0, express_1.Router)();
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).send(`<h1>Hit /history/{{location}} to get historical data of the specified location. /current/{{location}} will return the up-to-date statistics.</h1>
			<p>/locations lists all the available locations.</p>
			`);
}));
router.get('/locations', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json(countryCodes_1.default.map((value) => {
        return {
            name: value.db_name,
            lat: value.latitude,
            lng: value.longitude,
            alpha2: value.alpha2code,
            alpha3: value.alpha3code,
        };
    }));
}));
exports.default = router;
//# sourceMappingURL=home.js.map