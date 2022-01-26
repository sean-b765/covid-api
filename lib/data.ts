/**
 * Author: Sean Boaden
 * Date: 19-01-2022
 * Description: Helper functions for updating/initialising MongoDB with latest COVID data
 */

import axios, { AxiosResponse } from 'axios'
import moment from 'moment'
import History from '../models/History'
import {
	RawCurrentRecord,
	HistoricalRecord,
	RawHistoricalRecord,
} from '../types'
import csv from 'csvtojson'
import Current from '../models/Current'
import countryCodes from './countryCodes'
import Key from '../models/Key'

/**
 * Updates the database if it has been 12 hours since the last update
 *  When finished, the date Key will be updated.
 */
export const dailyUpdate = () => {
	Key.findOne()
		.then(async (response) => {
			// If it has not been 12 hours since the last update, don't continue
			if (!moment().isAfter(moment(response.lastPullDate).add(12, 'hours')))
				return

			// Check for the latest data in JHU repository
			await getCurrentData(appendCurrentDocs)
			// Check for latest historical data - OWID repo
			await appendHistorical()

			// Set the latestPullDate
			response.lastPullDate = moment().format()

			// Save the date Key
			await response.save()
		})
		.catch(() => {})
}

/*
	For the first initialization of the database
*/
export const initialFetch = () => {
	getHistoricalData()
	getCurrentData(createCurrentDocs)

	// Remove the existing Key
	Key.remove()

	// Create new Key
	Key.create({ lastPullDate: moment().format() }).then(() => {})
}

/*
  Should only be called for first initialization
*/
export const getHistoricalData = () => {
	axios
		.get(process.env.SOURCE_URL)
		.then((res) => {
			// convert text (csv)
			csv()
				.fromString(res.data)
				.then(async (res: RawHistoricalRecord[]) => {
					// Eliminate data redundancy before storing
					// Create an array of historical data rather than storing
					//  the same country data for all dates

					let _obj: { [key: string]: { data?: Array<HistoricalRecord> } } = {}

					res.map((record) => {
						// Already have an existing location key
						// test
						if (record.date === '2022-01-20' || record.date === '2022-01-19')
							return

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
							})
						} else {
							// Need to create the location key, initializing the data
							_obj[record.location] = {
								data: [],
							}
						}
					})

					// Ensure all data is sorted
					Object.values(_obj).map((data) => {
						data.data = data.data.sort(
							(a: HistoricalRecord, b: HistoricalRecord) =>
								moment(a.date).diff(b.date)
						)
					})

					// Create records
					Object.keys(_obj).map(async (data) => {
						await History.create({
							location: data,
							data: _obj[data].data,
						})
					})
				})
		})
		.catch((err) => console.log(err))
}

/*
  Function ran on a timer to update collection daily
*/
export const appendHistorical = async () => {
	const res = await axios.get(process.env.SOURCE_URL)
	const records: RawHistoricalRecord[] = await csv().fromString(res.data)

	try {
		const dateNow = moment().format('YYYY-MM-DD')

		console.log(`HISTORICAL::${dateNow} - Starting daily update`)

		// Filter the array by only World records
		const csvArray = records.filter((item) => item.location === 'World')
		// The last index of the array will be the latest record
		const latestAvailableDate = csvArray[csvArray.length - 1].date

		// Get all History data from Mongo
		const documents = await History.find()

		// Single test document to find latest date in data array
		const worldDocument = documents.filter((doc) => doc.location === 'World')[0]

		const latestInDb = worldDocument.data[worldDocument.data.length - 1]

		// Exit if no update is required,
		//  i.e. DB latest record date is the same as CSV data date
		if (latestInDb.date === latestAvailableDate) {
			console.log(
				`HISTORICAL::${dateNow} - Already up-to-date, daily update not needed.`
			)
			return
		}

		console.log(`HISTORICAL::${dateNow} - Adding data after ${latestInDb.date}`)

		// We need to filter JHU data by date to isolate the newest data
		const newData = records.filter((record) =>
			moment(record.date).isAfter(latestInDb.date)
		)

		// Map through existing documents,
		//  pushing new data to the 'data' field
		documents.forEach(async (document) => {
			// filter the new JHU data,
			//  push each new record to the document.data array
			newData.filter((data) => {
				if (data.location !== document.location) return

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
				})
			})

			// save the document
			await document.save()
		})

		console.log(`HISTORICAL::${dateNow} - Daily update completed.`)
	} catch (err) {
		console.log(err)
		console.log(`HISTORICAL::${moment().format('YYYY-MM-DD')} - Error/exiting`)
	}
}

/**
 * Get latest current data
 * @param createFn The function
 */
export const getCurrentData = async (createFn: Function) => {
	let response = 0,
		pass = 0,
		_records: RawCurrentRecord[]

	console.log(`CURRENT::${moment().format('YYYY-MM-DD')} - Fetching...`)

	// If response is 404, there is no csv data for the date.
	//  200 indicates a hit and will stop the loop
	do {
		const date =
			pass === 0
				? moment().format('MM-DD-YYYY')
				: moment()
						.subtract(pass, pass === 1 ? 'day' : 'days')
						.format('MM-DD-YYYY')

		const { status, records } = await fetchCurrent(date)
		response = status
		if (records) _records = records

		pass++
	} while (response === 404)

	if (!_records) return

	// Handle the records
	console.log(`CURRENT::${moment().format('YYYY-MM-DD')} - Processing data...`)
	createFn(_records)

	console.log(
		`CURRENT::${moment().format('YYYY-MM-DD')} - Created documents. Data added.`
	)
}

type CurrentDictionary = {
	[key: string]: {
		location: string
		lat: string
		lng: string
		provinces: Array<{
			zip: string
			county: string
			state: string
			lat: string
			lng: string
			cumulative: string
			deaths: string
			recovered: string
		}>
		cumulative?: string
		deaths?: string
		recovered?: string
	}
}

/**
 * The returns either 404 or 200. If 404 is returned,
 *  pass is to be incremented (in the calling function) which means the next day (previous) will be fetched
 *
 * @param date data to get
 * @returns `status object` 404 or 200
 */
async function fetchCurrent(date: string) {
	let result: AxiosResponse<any, any>

	// GET the latest csv data from JHU
	try {
		result = await axios.get(`${process.env.CURRENT_SOURCE_URL}${date}.csv`)
	} catch (err) {
		// Any errors from github must be returned as a 404 status
		return { status: 404 }
	}

	if (result.status !== 200) return { status: 404 }

	// CSV to JSON
	let res = await csv().fromString(result.data)

	// Make sure to filter out records without lat/long fields
	const _records: RawCurrentRecord[] = res.filter(
		(item) => item.Lat !== '' && item.Long_ !== ''
	)

	return { status: 200, records: _records }
}

/**
 * Parses the raw json data to a DB-ready dictionary object
 * @param records The records parsed by csvtojson
 * @returns `dictionary` object of key-value data
 */
const parseCurrentRecords = (records: RawCurrentRecord[]) => {
	let dictionary: CurrentDictionary = {}

	records.forEach((record: RawCurrentRecord) => {
		// Get the db_name, if it exists.
		// United States in OWID = US in JHU repo. Take into account inconsistencies
		//  between OWID and JHU country names
		const ccode = countryCodes.filter(
			(country) =>
				country.db_name === record.Country_Region ||
				country.alpha2code === record.Country_Region ||
				country.name === record.Country_Region ||
				country.other_name === record.Country_Region
		)[0]

		let db_name, latitude, longitude

		if (ccode) {
			db_name = ccode.db_name
			latitude = ccode.latitude
			longitude = ccode.longitude
		}

		if (db_name === undefined) return

		// Store results in our dictionary object
		if (Object.keys(dictionary).includes(db_name)) {
			dictionary[db_name].provinces.push({
				zip: record?.FIPS,
				county: record?.Admin2,
				state: record?.Province_State,
				lat: record?.Lat,
				lng: record?.Long_,
				cumulative: record?.Confirmed,
				deaths: record?.Deaths,
				recovered: record?.Recovered,
			})
		} else {
			// If this is a state rather than country, initialize accordingly
			if (record?.Province_State !== '') {
				dictionary[db_name] = {
					location: db_name,
					lat: latitude,
					lng: longitude,
					provinces: [],
				}
				// Add to provinces
				dictionary[db_name].provinces.push({
					zip: record?.FIPS,
					county: record?.Admin2,
					state: record?.Province_State,
					lat: record?.Lat,
					lng: record?.Long_,
					cumulative: record?.Confirmed,
					deaths: record?.Deaths,
					recovered: record?.Recovered,
				})
			} else {
				// It is a country, not a state. Provinces will always be an empty array for countries without state data
				dictionary[db_name] = {
					location: db_name,
					lat: latitude,
					lng: longitude,
					provinces: [],
					cumulative: record?.Confirmed,
					deaths: record?.Deaths,
					recovered: record?.Recovered,
				}
			}
		}
	})

	return { dictionary }
}

/**
 * Creates DB documents with the given array
 * @param records the records returned from fetch function
 */
const createCurrentDocs = (records: RawCurrentRecord[]) => {
	const { dictionary } = parseCurrentRecords(records)

	// Create DB records
	Object.values(dictionary).map(async (value) => {
		await Current.create(
			value.provinces.length === 0
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
				  }
		)
	})
}

/**
 * Updates current MongoDB documents
 * @param records records returned from fetch function
 */
const appendCurrentDocs = async (records: RawCurrentRecord[]) => {
	const { dictionary } = parseCurrentRecords(records)

	// Simply loop through and set properties
	Object.values(dictionary).forEach(async (value) => {
		const current = await Current.findOne({ location: value.location })

		current.cumulative = value.cumulative
		current.deaths = value.deaths
		current.provinces = value.provinces
		current.recovered = value.recovered

		await current.save()
	})
}
