# COVID-19 API

Uses latest data from John Hopkins University. Historical data is pulled from the [OWID repository](https://github.com/owid/covid-19-data/blob/master/public/data/jhu/full_data.csv), which collates all the previous dates into one CSV file. Current data is pulled from [JHU's repository](https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_daily_reports).

A worker thread is used to perform daily updates. Due to the free heroku plan idling when no activity is detected, these updates occur when the service is started. Your response may contain outdated data while the worker thread updates the database.

## List all Locations

_Some listings (e.g. Bermuda) are provinces belonging to a larger territory. Current data does not list Bermuda, as it is a province of the United Kingdom_

https://covid-history.herokuapp.com/locations

## Historical data

Use (almost) all options from `/locations` route, or continents, or World
e.g.

https://covid-history.herokuapp.com/history/World

https://covid-history.herokuapp.com/history/North%20America

https://covid-history.herokuapp.com/history/India

```ts
type response = [
	{
		location: string
		data: [
			{
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
		]
	}
]
```

## Current data

Will return a total for the country, as well as all provinces (if data exists)
e.g.

https://covid-history.herokuapp.com/current/Australia

https://covid-history.herokuapp.com/current/United%20Kingdom

```ts
type response = [
	{
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
		cumulative: string
		deaths: string
		recovered: string
	}
]
```
