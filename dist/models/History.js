"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const historySchema = new mongoose_1.default.Schema({
    location: String,
    data: [
        {
            date: String,
            new_cases: String,
            new_deaths: String,
            total_cases: String,
            total_deaths: String,
            weekly_cases: String,
            weekly_deaths: String,
            biweekly_cases: String,
            biweekly_deaths: String,
        },
    ],
});
exports.default = mongoose_1.default.model('History', historySchema);
//# sourceMappingURL=History.js.map