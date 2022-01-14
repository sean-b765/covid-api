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
exports.getCountryData = void 0;
const Country_1 = __importDefault(require("../models/Country"));
const getCountryData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { countryName } = req.params;
        const result = yield Country_1.default.find({ location: countryName });
        if (!result)
            return res.status(400).json({ message: 'No results found.' });
        res.status(200).json(result);
    }
    catch (err) {
        return res.sendStatus(500);
    }
});
exports.getCountryData = getCountryData;
//# sourceMappingURL=country.js.map