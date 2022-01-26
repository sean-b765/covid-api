import { Router } from 'express'
import { getAllCurrent, getLocationCurrent } from '../controllers/current'

const router = Router()

router.get('/current/:location', getLocationCurrent)
router.get('/current', getAllCurrent)

export default router
