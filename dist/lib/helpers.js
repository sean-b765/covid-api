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
exports.getCurrentData = exports.appendData = exports.getAllData = void 0;
const axios_1 = __importDefault(require("axios"));
const moment_1 = __importDefault(require("moment"));
const History_1 = __importDefault(require("../models/History"));
const csvtojson_1 = __importDefault(require("csvtojson"));
const Current_1 = __importDefault(require("../models/Current"));
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
            // Eliminate data redundancy before storing
            // Create an array of historical data rather than storing
            //  the same country data for all dates
            let _obj = {};
            res.map((record) => {
                // Already have an existing location key
                // test
                if (record.date === '2022-01-20' || record.date === '2022-01-19')
                    return;
                if (Object.keys(_obj).includes(record.location)) {
                    _obj[record.location].data.push({
                        date: record.date,
                        new_cases: record.new_cases,
                        new_deaths: record.new_deaths,
                        total_cases: record.total_cases,
                        total_deaths: record.total_deaths,
                        weekly_cases: record.weekly_cases,
                        weekly_deaths: record.weekly_deaths,
                        biweekly_cases: record.biweekly_cases,
                        biweekly_deaths: record.biweekly_deaths,
                    });
                }
                else {
                    // Need to create the location key, initializing the data
                    _obj[record.location] = {
                        data: [],
                    };
                }
            });
            // Ensure all data are sorted
            Object.values(_obj).map((data) => {
                data.data = data.data.sort((a, b) => (0, moment_1.default)(a.date).diff(b.date));
            });
            // Create records
            Object.keys(_obj).map((data) => __awaiter(void 0, void 0, void 0, function* () {
                yield History_1.default.create({
                    location: data,
                    data: _obj[data].data,
                });
            }));
        }));
    })
        .catch((err) => console.log(err));
};
exports.getAllData = getAllData;
/*
  Only used for testing getDataDaily(). Should never be called in production
*/
const deleteDay = (date) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield History_1.default.deleteMany({ date });
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
                const dateNow = (0, moment_1.default)().format('YYYY-MM-DD');
                console.log(`DB_UPDATE::${dateNow} - Starting daily DB update.`);
                // Filter the array by only World records
                const csvArray = records.filter((item) => item.location === 'World');
                // if the array is not sorted, we can't grab the last record to find the last date
                let sortedCSV = csvArray.sort((a, b) => (0, moment_1.default)(a.date).diff(b.date));
                // The last index of the array will be the latest record
                const latestAvailableDate = sortedCSV[csvArray.length - 1].date;
                // Get all History data from Mongo
                const documents = yield History_1.default.find();
                // Single test document to find latest date in data array
                const worldDocument = documents.filter((value) => value.location === 'World')[0];
                const latestInDb = worldDocument.data[worldDocument.data.length - 1];
                // Exit if no update is required,
                //  i.e. DB latest record date is the same as CSV data date
                if (latestInDb.date === latestAvailableDate) {
                    console.log(`DB_UPDATE::${dateNow} - Already up-to-date, daily update not needed - latest available from source: ${latestAvailableDate}`);
                    return;
                }
                console.log(`DB_UPDATE::${dateNow} - Adding data after ${latestInDb.date}`);
                // We need to filter JHU data by date to isolate the newest data
                const newData = records.filter((record) => (0, moment_1.default)(record.date).isAfter(latestInDb.date));
                // Map through existing documents,
                //  pushing new data to the 'data' field
                documents.map((document) => __awaiter(void 0, void 0, void 0, function* () {
                    // filter the new JHU data,
                    //  push each new record to the document.data array
                    newData.filter((data) => {
                        if (data.location !== document.location)
                            return;
                        document.data.push({
                            date: data.date,
                            total_cases: data.total_cases,
                            total_deaths: data.total_deaths,
                            new_cases: data.new_cases,
                            new_deaths: data.new_deaths,
                            weekly_cases: data.weekly_cases,
                            weekly_deaths: data.weekly_deaths,
                            biweekly_cases: data.biweekly_cases,
                            biweekly_deaths: data.biweekly_deaths,
                        });
                    });
                    // save the document
                    yield document.save();
                }));
                console.log(`DB_UPDATE::${dateNow} - Daily update completed. Added data from ${(0, moment_1.default)(latestInDb.date)
                    .add(1, 'day')
                    .format('YYYY-MM-DD')} to ${latestAvailableDate}, inclusive.`);
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
/*
    Get current data for the day, includes cumulative cases
*/
const getCurrentData = () => {
    axios_1.default
        .get(`${process.env.CURRENT_SOURCE_URL}${(0, moment_1.default)()
        .subtract(1, 'day')
        .format('MM-DD-YYYY')}.csv`)
        .then((res) => {
        // convert text (csv)
        (0, csvtojson_1.default)()
            .fromString(res.data)
            .then((res) => __awaiter(void 0, void 0, void 0, function* () {
            // Make sure to filter out records without lat/long fields
            const records = res
                .map((item) => {
                return {
                    zip: item === null || item === void 0 ? void 0 : item.FIPS,
                    county: item === null || item === void 0 ? void 0 : item.Admin2,
                    state: item === null || item === void 0 ? void 0 : item.Province_State,
                    country: item === null || item === void 0 ? void 0 : item.Country_Region,
                    lat: item === null || item === void 0 ? void 0 : item.Lat,
                    lng: item === null || item === void 0 ? void 0 : item.Long_,
                    cumulative: item === null || item === void 0 ? void 0 : item.Confirmed,
                    deaths: item === null || item === void 0 ? void 0 : item.Deaths,
                    recovered: item === null || item === void 0 ? void 0 : item.Recovered,
                };
            })
                .filter((item) => item.lat && item.lng);
            // create DB records
            yield Current_1.default.create(records);
        }));
    })
        .catch((err) => console.log(err));
};
exports.getCurrentData = getCurrentData;
//# sourceMappingURL=helpers.js.map