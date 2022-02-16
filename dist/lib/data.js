"use strict";
/**
 * Author: Sean Boaden
 * Date: 19-01-2022
 * Description: Helper functions for updating/initialising MongoDB with latest COVID data
 */
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
exports.getCurrentData = exports.appendHistorical = exports.getHistoricalData = exports.initialFetch = exports.dailyUpdate = void 0;
const axios_1 = __importDefault(require("axios"));
const moment_1 = __importDefault(require("moment"));
const History_1 = __importDefault(require("../models/History"));
const csvtojson_1 = __importDefault(require("csvtojson"));
const Current_1 = __importDefault(require("../models/Current"));
const countryCodes_1 = __importDefault(require("./countryCodes"));
const Key_1 = __importDefault(require("../models/Key"));
/**
 * Updates the database if it has been 12 hours since the last update
 *  When finished, the date Key will be updated.
 */
const dailyUpdate = () => {
    Key_1.default.findOne()
        .then((response) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`WORKER::${(0, moment_1.default)().format('YYYY-MM-DD')} - Checking lastPullDate`);
        // If it has not been 12 hours since the last update, don't continue
        if (!(0, moment_1.default)().isAfter((0, moment_1.default)(response.lastPullDate).add(12, 'hours'))) {
            console.log(`WORKER::${(0, moment_1.default)().format('YYYY-MM-DD')} - No update needed`);
            return;
        }
        console.log(`WORKER::${(0, moment_1.default)().format('YYYY-MM-DD')} - Performing DB update`);
        // Check for the latest data in JHU repository
        yield (0, exports.getCurrentData)(appendCurrentDocs);
        // Check for latest historical data - OWID repo
        yield (0, exports.appendHistorical)();
        console.log(`WORKER::${(0, moment_1.default)().format('YYYY-MM-DD')} - DB update complete`);
        // Set the latestPullDate
        response.lastPullDate = (0, moment_1.default)().format();
        // Save the date Key
        yield response.save();
    }))
        .catch((err) => {
        console.log(err);
    });
};
exports.dailyUpdate = dailyUpdate;
/*
     For the first initialization of the database
 */
const initialFetch = () => {
    (0, exports.getHistoricalData)();
    (0, exports.getCurrentData)(createCurrentDocs);
    // Remove the existing Key
    Key_1.default.remove();
    // Create new Key
    Key_1.default.create({ lastPullDate: (0, moment_1.default)().format() }).then(() => { });
};
exports.initialFetch = initialFetch;
/*
     Should only be called for first initialization
 */
const getHistoricalData = () => {
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
            // Ensure all data is sorted
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
exports.getHistoricalData = getHistoricalData;
const getSourceData = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield axios_1.default.get(process.env.SOURCE_URL);
    return data.data;
});
/**
 * Returns a promise which is fulfilled after ALL documents have been updated with newData
 * @param newData new data to be added
 * @returns Promise
 */
const updateDocs = (newData) => __awaiter(void 0, void 0, void 0, function* () {
    // For all new data we should find the corresponding location and push the data to the data array
    return Promise.all(newData.map((datum) => __awaiter(void 0, void 0, void 0, function* () {
        yield History_1.default.findOneAndUpdate({ location: datum.location }, {
            $push: {
                data: {
                    date: datum.date,
                    total_cases: datum.total_cases,
                    total_deaths: datum.total_deaths,
                    new_cases: datum.new_cases,
                    new_deaths: datum.new_deaths,
                    weekly_cases: datum.weekly_cases,
                    weekly_deaths: datum.weekly_deaths,
                    biweekly_cases: datum.biweekly_cases,
                    biweekly_deaths: datum.biweekly_deaths,
                },
            },
        });
    })));
});
/*
    Function ran on a timer to update collection daily
 */
const appendHistorical = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Single test document to find latest date in data array
        let latestInDb = yield History_1.default.findOne({ location: 'World' }, { data: { $slice: -1 } });
        const latestDbDate = latestInDb.data[0].date;
        let data = yield (0, csvtojson_1.default)().fromString(yield getSourceData());
        const dateNow = (0, moment_1.default)().format('YYYY-MM-DD');
        console.log(`HISTORICAL::${dateNow} - Starting daily update`);
        // Filter the array by only World records
        let latestAvailableDate = data.filter((item) => item.location === 'World');
        // The last index of the array will be the latest record
        latestAvailableDate =
            latestAvailableDate[latestAvailableDate.length - 1].date;
        // Exit if no update is required,
        //  i.e. DB latest record date is the same as CSV data date
        if (latestDbDate === latestAvailableDate) {
            console.log(`HISTORICAL::${dateNow} - Already up-to-date, daily update not needed.`);
            return;
        }
        console.log(`HISTORICAL::${dateNow} - Adding data after ${latestDbDate}`);
        // We need to filter JHU data by date to isolate the newest data
        let newData = data.filter((record) => (0, moment_1.default)(record.date).isAfter(latestDbDate));
        // Wait for all newData to be pushed to DB
        yield updateDocs(newData);
        latestInDb = null;
        data = null;
        newData = null;
        console.log(`HISTORICAL::${dateNow} - Daily update completed.`);
    }
    catch (err) {
        console.log(err);
        console.log(`HISTORICAL::${(0, moment_1.default)().format('YYYY-MM-DD')} - Error/exiting`);
    }
});
exports.appendHistorical = appendHistorical;
/**
 * Get latest current data
 * @param createFn The function
 */
const getCurrentData = (createFn) => __awaiter(void 0, void 0, void 0, function* () {
    let response = 0, pass = 0, _records;
    console.log(`CURRENT::${(0, moment_1.default)().format('YYYY-MM-DD')} - Fetching...`);
    // If response is 404, there is no csv data for the date.
    //  200 indicates a hit and will stop the loop
    do {
        const date = pass === 0
            ? (0, moment_1.default)().format('MM-DD-YYYY')
            : (0, moment_1.default)()
                .subtract(pass, pass === 1 ? 'day' : 'days')
                .format('MM-DD-YYYY');
        console.log(`Fetch attempt ${date}`);
        const { status, records } = yield fetchCurrent(date);
        response = status;
        if (records)
            _records = records;
        console.log(`Status: ${status}. ${status === 200 && records.length}`);
        pass++;
    } while (response === 404 && pass < 10);
    if (!_records)
        return;
    // Handle the records
    console.log(`CURRENT::${(0, moment_1.default)().format('YYYY-MM-DD')} - Processing data...`);
    yield createFn(_records);
    console.log(`CURRENT::${(0, moment_1.default)().format('YYYY-MM-DD')} - Data added`);
});
exports.getCurrentData = getCurrentData;
/**
 * The returns either 404 or 200. If 404 is returned,
 *  pass is to be incremented (in the calling function) which means the next day (previous) will be fetched
 *
 * @param date data to get
 * @returns `status object` 404 or 200
 */
function fetchCurrent(date) {
    return __awaiter(this, void 0, void 0, function* () {
        let result;
        // GET the latest csv data from JHU
        try {
            result = yield axios_1.default.get(`${process.env.CURRENT_SOURCE_URL}${date}.csv`);
        }
        catch (err) {
            // Any errors from github must be returned as a 404 status
            return { status: 404 };
        }
        if (result.status !== 200)
            return { status: 404 };
        // CSV to JSON
        let res = yield (0, csvtojson_1.default)().fromString(result.data);
        // Make sure to filter out records without lat/long fields
        const _records = res.filter((item) => item.Lat !== '' && item.Long_ !== '');
        return { status: 200, records: _records };
    });
}
/**
 * Parses the raw json data to a DB-ready dictionary object
 * @param records The records parsed by csvtojson
 * @returns `dictionary` object of key-value data
 */
const parseCurrentRecords = (records) => {
    let dictionary = {};
    records.forEach((record) => {
        // Get the db_name, if it exists.
        // United States in OWID = US in JHU repo. Take into account inconsistencies
        //  between OWID and JHU country names
        const ccode = countryCodes_1.default.filter((country) => country.db_name === record.Country_Region ||
            country.alpha2code === record.Country_Region ||
            country.name === record.Country_Region ||
            country.other_name === record.Country_Region)[0];
        let db_name, latitude, longitude;
        if (ccode) {
            db_name = ccode.db_name;
            latitude = ccode.latitude;
            longitude = ccode.longitude;
        }
        if (db_name === undefined)
            return;
        // Store results in our dictionary object
        if (Object.keys(dictionary).includes(db_name)) {
            dictionary[db_name].provinces.push({
                zip: record === null || record === void 0 ? void 0 : record.FIPS,
                county: record === null || record === void 0 ? void 0 : record.Admin2,
                state: record === null || record === void 0 ? void 0 : record.Province_State,
                lat: record === null || record === void 0 ? void 0 : record.Lat,
                lng: record === null || record === void 0 ? void 0 : record.Long_,
                cumulative: record === null || record === void 0 ? void 0 : record.Confirmed,
                deaths: record === null || record === void 0 ? void 0 : record.Deaths,
                recovered: record === null || record === void 0 ? void 0 : record.Recovered,
            });
        }
        else {
            // If this is a state rather than country, initialize accordingly
            if ((record === null || record === void 0 ? void 0 : record.Province_State) !== '') {
                dictionary[db_name] = {
                    location: db_name,
                    lat: latitude,
                    lng: longitude,
                    provinces: [],
                };
                // Add to provinces
                dictionary[db_name].provinces.push({
                    zip: record === null || record === void 0 ? void 0 : record.FIPS,
                    county: record === null || record === void 0 ? void 0 : record.Admin2,
                    state: record === null || record === void 0 ? void 0 : record.Province_State,
                    lat: record === null || record === void 0 ? void 0 : record.Lat,
                    lng: record === null || record === void 0 ? void 0 : record.Long_,
                    cumulative: record === null || record === void 0 ? void 0 : record.Confirmed,
                    deaths: record === null || record === void 0 ? void 0 : record.Deaths,
                    recovered: record === null || record === void 0 ? void 0 : record.Recovered,
                });
            }
            else {
                // It is a country, not a state. Provinces will always be an empty array for countries without state data
                dictionary[db_name] = {
                    location: db_name,
                    lat: latitude,
                    lng: longitude,
                    provinces: [],
                    cumulative: record === null || record === void 0 ? void 0 : record.Confirmed,
                    deaths: record === null || record === void 0 ? void 0 : record.Deaths,
                    recovered: record === null || record === void 0 ? void 0 : record.Recovered,
                };
            }
        }
    });
    return { dictionary };
};
/**
 * Creates DB documents with the given array
 * @param records the records returned from fetch function
 */
const createCurrentDocs = (records) => {
    const { dictionary } = parseCurrentRecords(records);
    // Create DB records
    Object.values(dictionary).map((value) => __awaiter(void 0, void 0, void 0, function* () {
        yield Current_1.default.create(value.provinces.length === 0
            ? {
                location: value.location,
                lat: value.lat,
                lng: value.lng,
                provinces: [],
                cumulative: value.cumulative,
                deaths: value.deaths,
                recovered: value.recovered,
            }
            : {
                location: value.location,
                lat: value.lat,
                lng: value.lng,
                provinces: value.provinces,
                cumulative: `${value.provinces
                    .map((item) => Number(item.cumulative))
                    .reduce((prev, next) => prev + next)}`,
                deaths: `${value.provinces
                    .map((item) => Number(item.deaths))
                    .reduce((prev, next) => prev + next)}`,
                recovered: `${value.provinces
                    .map((item) => Number(item.recovered))
                    .reduce((prev, next) => prev + next)}`,
            });
    }));
};
/**
 * Updates current MongoDB documents
 * @param records records returned from fetch function
 */
const appendCurrentDocs = (records) => __awaiter(void 0, void 0, void 0, function* () {
    const { dictionary } = parseCurrentRecords(records);
    // Simply loop through and set properties.
    //  use Promise.all to wait for all operations to complete
    yield Promise.all(Object.values(dictionary).map((value) => __awaiter(void 0, void 0, void 0, function* () {
        const current = yield Current_1.default.findOne({ location: value.location });
        try {
            // If there are provinces present, get the sum of cumulative, deaths, recovered statistics via reduce
            if (!Boolean(current.provinces.length)) {
                current.cumulative = `${value.provinces
                    .map((item) => Number(item.cumulative))
                    .reduce((prev, next) => prev + next)}`;
                current.deaths = `${value.provinces
                    .map((item) => Number(item.deaths))
                    .reduce((prev, next) => prev + next)}`;
                current.recovered = `${value.provinces
                    .map((item) => Number(item.recovered))
                    .reduce((prev, next) => prev + next)}`;
            }
            else {
                // location contains no provinces, cumulative is already present
                current.cumulative = value.cumulative;
                current.deaths = value.deaths;
                current.recovered = value.recovered;
            }
        }
        catch (err) {
            console.log(err);
        }
        current.provinces = value.provinces;
        yield current.save();
    })));
});
//# sourceMappingURL=data.js.map