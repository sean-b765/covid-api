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
exports.getHistoricalData = void 0;
const moment_1 = __importDefault(require("moment"));
const Country_1 = __importDefault(require("../models/Country"));
const getHistoricalData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { location } = req.params;
        const result = yield Country_1.default.find({ location });
        if (!result)
            return res.status(400).json({ message: 'No results found.' });
        let sorted = result.sort((a, b) => (0, moment_1.default)(a.date).diff(b.date));
        res.status(200).json(sorted);
    }
    catch (err) {
        return res.sendStatus(500);
    }
});
exports.getHistoricalData = getHistoricalData;
//# sourceMappingURL=history.js.map