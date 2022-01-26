"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
// FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key,Incident_Rate,Case_Fatality_Ratio
const currentSchema = new mongoose_1.default.Schema({
    location: String,
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
    lat: { type: String, required: false },
    lng: { type: String, required: false },
    cumulative: { type: String, required: false },
    deaths: { type: String, required: false },
    recovered: { type: String, required: false },
});
exports.default = mongoose_1.default.model('Current', currentSchema);
//# sourceMappingURL=Current.js.map