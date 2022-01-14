import { Router } from 'express'
import { getHistoricalData } from '../controllers/history'

const router = Router()

router.get('/history/:location', getHistoricalData)

export default router
