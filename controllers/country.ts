import { Request, Response } from 'express'
import Country from '../models/Country'

export const getCountryData = async (req: Request, res: Response) => {
	try {
		const { countryName } = req.params

		const result = await Country.find({ location: countryName })

		res.status(200).json(result)
	} catch (err) {
		return res.sendStatus(500)
	}
}
