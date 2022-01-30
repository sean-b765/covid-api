"use strict";
/**
 * Author: Sean Boaden
 * Date: 28-01-2022
 * Description: Worker thread for performing daily DB updates
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const data_1 = require("./lib/data");
mongoose_1.default.connect(process.env.MONGO_URL, () => {
    console.log(`Connected to MongoDB on worker thread`);
});
// Check if DB needs update every few hours
//  if the lastPullDate was atleast 12 hours ago, it will update the DB
// Every 60 mins - check for daily update
(0, data_1.dailyUpdate)();
setInterval(data_1.dailyUpdate, 1000 * 60 * 60);
//# sourceMappingURL=worker.js.map