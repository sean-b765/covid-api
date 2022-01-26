"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const countrySchema = new mongoose_1.default.Schema({
    location: { type: String, unique: true },
    provinces: [
        {
            county: { type: String, required: false },
            zip: { type: String, required: false },
            state: { type: String, required: false },
            lat: { type: String },
            lng: { type: String },
            cumulative: { type: String },
            deaths: { type: String },
            recovered: { type: String },
        },
    ],
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
    lat: { type: String, required: false },
    lng: { type: String, required: false },
    cumulative: { type: String, required: false },
    deaths: { type: String, required: false },
    recovered: { type: String, required: false },
});
exports.default = mongoose_1.default.model('Country', countrySchema);
//# sourceMappingURL=Country.js.map