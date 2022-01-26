export type RawHistoricalRecord = {
	date: string
	location: string
	new_cases: string
	new_deaths: string
	total_cases: string
	total_deaths: string
	weekly_cases: string
	weekly_deaths: string
	biweekly_cases: string
	biweekly_deaths: string
}

export type RawCurrentRecord = {
	/** (US) Zip code */
	FIPS: string
	/** (US) County */
	Admin2: string
	/** State */
	Province_State: string
	/** Country */
	Country_Region: string
	Last_Update: string
	/** latitude */
	Lat: string
	/** longitude */
	Long_: string
	/** Cumulative cases */
	Confirmed: string
	Deaths: string
	Recovered: string
	Active: string
	Combined_Key: string
	Incident_Rate: string
	Case_Fatality_Ratio: string
}

export type HistoricalRecord = {
	date: string
	new_cases: string
	new_deaths: string
	total_cases: string
	total_deaths: string
	weekly_cases: string
	weekly_deaths: string
	biweekly_cases: string
	biweekly_deaths: string
}

export type CurrentRecord = {
	location: string
	provinces: [
		{
			county: string
			zip: string
			state: string
			lat: string
			lng: string
			cumulative: string
			deaths: string
			recovered: string
		}
	]
	lat: string
	lng: string
	cumulative?: string
	deaths?: string
	recovered?: string
}
