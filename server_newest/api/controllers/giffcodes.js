const {saveHistory, loadHistory} = require('../utils/history')
const {saveStatistic} = require('../utils/statistic')
const {saveUserItem} = require('./../utils/userItem')

const Code = require('../models/giffcode')

exports.getAll = (req, res, next) => {

    if (req.userData.roles != 'admin'){
        return res.status(403).json({
            msg: 'ValidatorError',
            errors: {
                user: `You don't have the permission!`
            }
        })
    }

    const page = parseInt(req.query.page) || 1
    const items_per_page = parseInt(req.query.limit) || 100

    if (page < 1) page = 1

    Code.find({})
    .select('_id code type items isUsed expiresTime')
    .skip((page - 1) * items_per_page)
    .limit(items_per_page)
    .then(async codes => {
        const request = {}
        const len = await Code.find({}).countDocuments()

        request.currentPage = page
        request.totalPages = Math.ceil(len / items_per_page)

        if (page > 1) {
            request.previous = {
                page: page - 1,
                limit: items_per_page
            }
        }

        if (page * items_per_page < len) {
            request.next = {
                page: page + 1,
                limit: items_per_page
            }
        }

        const response = {
            msg: 'success',
            length: codes.length,
            giffcodes: codes.map(code => {
                return {
                    _id: code._id,
                    code: code.code,
                    type: code.type,
                    items: code.items,
                    isUsed: code.isUsed,
                    expiresTime: code.expiresTime,
                    request: {
                        type: 'GET',
                        url: req.hostname + '/giffcodes/' + code._id
                    }
                }
            }),
            request
        }

        // res.set("x-total-count", codes.length);
        res.status(200).json(response)
    })
    .catch(error => {
        res.status(500).json({
            msg: 'Server error!',
            error
        })
    })
}

exports.getOne = (req, res, next) => {
    const {codeId} = req.params

    if (req.userData.roles != 'admin'){
        return res.status(403).json({
            msg: 'ValidatorError',
            errors: {
                user: `You don't have the permission!`
            }
        })
    }

    Code.findById(codeId)
    .select('_id code type items isUsed expiresTime')
    .then(code => {
        if (!code) {
            return res.status(202).json({
                msg: 'ValidatorError',
                errors: {
                    user: `Code not found!`
                }
            })
        }

        res.status(200).json({
            msg: "success",
            code: {
                _id: code._id,
                code: code.code,
                type: code.type,
                items: code.items,
                isUsed: code.isUsed,
                expiresTime: code.expiresTime,
                request: {
                    type: 'GET',
                    url: req.hostname + '/giffcodes'
                }
            }
        })
    })
    .catch(error => {
        res.status(500).json({
            msg: "Server error!",
            error
        })
    })
}

exports.create = (req, res, next) => {
    const {code, type, items} = req.body
    let {expiresTime} = req.body

    if (req.userData.roles != 'admin'){
        return res.status(403).json({
            msg: `You don't have the permission!`
        })
    }

    try {
        +expiresTime > 0 ? expiresTime = Date.now() + +expiresTime*24*60*60*1000 : expiresTime = Date.now() + 259200000

        const codeObj = new Code({
            code,
            type,
            items,
            expiresTime
        })

        codeObj.save()
        .then(async newCode => {

            await saveHistory(req.userData._id, 'codes', 'manage', `Create a gift code: ${newCode._id}-${code}-${type.toLowerCase()}-${items.join('-')}-${newCode.expiresTime} | ${new Date()}`)

            res.status(201).json({
                msg: "success",
                code: {
                    _id: newCode._id,
                    code: newCode.code,
                    type: newCode.type,
                    items: newCode.items,
                    isUsed: newCode.isUsed,
                    expiresTime: newCode.expiresTime,
                    request: {
                        type: 'GET',
                        url: req.hostname + '/giffcodes/' + newCode._id
                    }
                }
            })
        })
        .catch(error => {
            let respond = {}
            error.errors && Object.keys(error.errors).forEach(err => respond[err] = error.errors[err].message)

            res.status(202).json({
                msg: 'ValidatorError',
                errors: respond
            })
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            msg: 'Server error!',
            error
        })
    }
}

exports.useOne = async (req, res, next) => {
    const {code} = req.params
    const {_id: userId} = req.userData
    let userItem = {}

    try {
        let validCode = await Code.findOne({code})

        if(!validCode){
            return res.status(202).json({
                msg: 'ValidatorError',
                errors: {
                    user: `Code does not exist!`
                }
            })
        }

        const {type, items, isUsed, expiresTime} = validCode

        if (expiresTime < Date.now()) {
            return res.status(202).json({
                msg: 'ValidatorError',
                errors: {
                    user: `The code has been expired!`
                }
            })
        }

        let historyCodes = await loadHistory(userId, 'codes', 'personal')
        historyCodes = historyCodes.map(his => his.split(' ')[2])

        if(type === 'Normal' && historyCodes.includes(code)) {
            return res.status(202).json({
                msg: 'ValidatorError',
                errors: {
                    user: `You has been using this code!`
                }
            })
        }

        if(isUsed) {
            return res.status(202).json({
                msg: 'ValidatorError',
                errors: {
                    user: `The code has been used!`
                }
            })
        }
        else {
           userItem =  await saveUserItem(userId, items, 0)
        }

        if (type === 'Vip') {
            validCode.isUsed = true
        }

        await Promise.all([
            Code.updateOne({_id: validCode._id}, {$set: validCode}),
            saveHistory(userId, 'codes', 'personal', `Used code: ${code} | ${new Date()}`),
            saveStatistic(0, 0, 0, 1, 0, 0),
        ])

        res.status(200).json({
            msg: 'success',
            userItem
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            msg: 'Server error!',
            error
        })
    }
}

exports.update = async (req, res, next) => {
    const {codeId: _id} = req.params

    if (req.userData.roles != 'admin'){
        return res.status(403).json({
            msg: 'ValidatorError',
            errors: {
                user: `You don't have the permission!`
            }
        })
    }

    const code = {}

    for (const ops of req.body) {
        code[ops.propName] = ops.value
    }

    try {
        const [, newCode] = await Promise.all([
            saveHistory(req.userData._id, 'codes', 'manage', `Update a gift code: ${_id}-${Object.keys(code).join('-')} | ${new Date()}`),
            Code.updateOne({_id}, {$set: code}, {runValidators: true})
        ])

        res.status(200).json({
            msg: "success",
            code: newCode,
            request: {
                type: 'GET',
                url: req.hostname + '/giffcodes/' + _id
            }
        })
    }
    catch (error) {
        console.log(error)
        let respond = {}
        error.errors && Object.keys(error.errors).forEach(err => respond[err] = error.errors[err].message)

        res.status(202).json({
            msg: 'ValidatorError',
            errors: respond
        })
    }
}

exports.delete = async (req, res, next) => {
    const {code: _code} = req.params

    if (req.userData.roles != 'admin'){
        return res.status(403).json({
            msg: 'ValidatorError',
            errors: {
                user: `You don't have the permission!`
            }
        })
    }

    try {
        const objCode = await Code.findOne({code: _code})

        if(!objCode) {
            return res.status(202).json({
                msg: 'ValidatorError',
                errors: {
                    user: `Code not found!`
                }
            })
        }

        const {_id, code, type, items, isUsed, expiresTime} = objCode

        await Promise.all([
            saveHistory(req.userData._id, 'codes', 'manage', `Delete a gift code: ${_id}-${code}-${type.toLowerCase()}-${items.join('-')}-${isUsed}-${expiresTime} | ${new Date()}`),
            Code.deleteOne({_id})
        ])

        res.status(200).json({
            msg: 'success',
            request: {
                type: 'POST',
                url: req.hostname + '/giffcodes',
                body: {
                    code: 'String',
                    type: 'String',
                    items: 'Array of Item id',
                    expiresTime: 'Number (millisecond)'
                }
            }
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            msg: 'Server error!',
            error
        })
    }
}