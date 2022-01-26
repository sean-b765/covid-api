Uses latest data from John Hopkins University. Historical data is pulled from the [OWID repository](https://github.com/owid/covid-19-data/blob/master/public/data/jhu/full_data.csv), which collates all the previous dates into one CSV file. Current data is pulled from [JHU's repository](https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_daily_reports).

## Historical data

https://covid-history.herokuapp.com/history/{countryName}

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

https://covid-history.herokuapp.com/current/{countryName}

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
