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
exports.appendData = exports.getAllData = void 0;
const axios_1 = __importDefault(require("axios"));
const moment_1 = __importDefault(require("moment"));
const Country_1 = __importDefault(require("../models/Country"));
const csvtojson_1 = __importDefault(require("csvtojson"));
/*
  Should only be called for first initialization
*/
const getAllData = () => {
    axios_1.default
        .get(process.env.SOURCE_URL)
        .then((res) => {
        // convert text (csv)
        (0, csvtojson_1.default)()
            .fromString(res.data)
            .then((res) => __awaiter(void 0, void 0, void 0, function* () {
            yield Country_1.default.create(res);
        }));
    })
        .catch((err) => console.log(err));
};
exports.getAllData = getAllData;
/*
  Only used for testing getDataDaily(). Should never be called in production
*/
const deleteDay = (date) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield Country_1.default.deleteMany({ date });
    console.log(`Deleted ${result.deletedCount} documents`);
});
/*
  Function ran on a timer to update collection daily
*/
const appendData = () => {
    axios_1.default
        .get(process.env.SOURCE_URL)
        .then((res) => {
        (0, csvtojson_1.default)()
            .fromString(res.data)
            .then((records) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const date = (0, moment_1.default)().format('YYYY-MM-DD');
                console.log(`DB_UPDATE::${date} - Starting daily DB update.`);
                // Filter the array by only World records
                const array = records.filter((item) => item.location === 'World');
                // The last index of the array will be the latest record
                const latestAvailableDate = array[array.length - 1].date;
                // Check if the latest date is already in the database
                const isLatestInDb = yield Country_1.default.exists({
                    date: latestAvailableDate,
                });
                // Exit if no update is required
                if (isLatestInDb) {
                    console.log(`DB_UPDATE::${date} - Already up-to-date, daily update not needed - latest available from source: ${latestAvailableDate}`);
                    return;
                }
                // The latest record does not exist in the database
                const latestDBResults = yield Country_1.default.find({
                    location: 'World',
                });
                const latestInDb = latestDBResults[latestDBResults.length - 1];
                console.log(`DB_UPDATE::${date} - Adding data after ${latestInDb.date}`);
                // We need to filter JHU data by date and add all of the most recent records which do not appear in the DB
                const newData = records.filter((record) => (0, moment_1.default)(record.date).isAfter(latestInDb.date));
                // Create documents with new JHU data
                const result = yield Country_1.default.create(newData);
                console.log(`DB_UPDATE::${date} - Daily update completed. Added ${result.length} new documents, starting at ${(0, moment_1.default)(latestInDb.date)
                    .add(1, 'day')
                    .format('YYYY-MM-DD')} to ${latestAvailableDate}.`);
            }
            catch (err) {
                console.log(err);
                console.log(`DB_UPDATE::${(0, moment_1.default)().format('YYYY-MM-DD')} - Error/exiting.`);
            }
        }));
    })
        .catch((err) => console.log(err));
};
exports.appendData = appendData;
//# sourceMappingURL=helpers.js.map