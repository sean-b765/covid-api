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
const moment_1 = __importDefault(require("moment"));
const mongoose_1 = __importDefault(require("mongoose"));
const data_1 = require("./lib/data");
mongoose_1.default.connect(process.env.MONGO_URL, () => {
    console.log(`Connected to MongoDB on worker thread`);
});
(function dailyTimer() {
    console.log(`WORKER::${(0, moment_1.default)().format('YYYY-MM-DD')} - Checking lastPullDate`);
    (0, data_1.dailyUpdate)();
    setTimeout(dailyTimer, 1000 * 60 * 60 * 2);
})();
//# sourceMappingURL=worker.js.map