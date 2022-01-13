import { Router } from 'express'
import { getCountryData } from '../controllers/country'

const router = Router()

router.get('/country/:countryName', getCountryData)

export default router
