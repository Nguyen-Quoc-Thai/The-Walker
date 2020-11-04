const express = require('express')

const HistoryController = require('./../controllers/histories')
const checkAuth = require('./../middleware/checkAuth')

const router = express.Router()

router.get('/', HistoryController.getAll)
router.get('/:userId', HistoryController.getOne)
router.post('/', HistoryController.create)
// router.patch('/:codeId', checkAuth, HistoryController.update)
// router.delete('/:codeId', checkAuth, HistoryController.delete)

module.exports = router