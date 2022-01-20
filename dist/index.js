"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const history_1 = __importDefault(require("./routes/history"));
const home_1 = __importDefault(require("./routes/home"));
const current_1 = __importDefault(require("./routes/current"));
const cors_1 = __importDefault(require("cors"));
const helpers_1 = require("./lib/helpers");
dotenv_1.default.config();
const app = (0, express_1.default)();
mongoose_1.default.connect(process.env.MONGO_URL, () => {
    console.log(`Connected to MongoDB: ${process.env.MONGO_URL}`);
});
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: '*',
}));
// Routes
app.use(history_1.default);
app.use(home_1.default);
app.use(current_1.default);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Express listening on port ${PORT}`);
});
(function dailyTimer() {
    (0, helpers_1.appendData)();
    setTimeout(dailyTimer, 1000 * 60 * 60 * 12);
})();
//# sourceMappingURL=index.js.map