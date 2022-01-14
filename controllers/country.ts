import { Request, Response } from 'express'
import Country from '../models/Country'

export const getCountryData = async (req: Request, res: Response) => {
	try {
		const { countryName } = req.params

		const result = await Country.find({ location: countryName })

		if (!result) return res.status(400).json({ message: 'No results found.' })

		res.status(200).json(result)
	} catch (err) {
		return res.sendStatus(500)
	}
}
