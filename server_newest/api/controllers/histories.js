const History = require('../models/history')

exports.getAll = (req, res, next) => {

    // if (req.userData.roles != 'admin'){
    //     return res.status(403).json({
    //         msg: `You don't have the permission!`
    //     })
    // }

    History.find({})
    .select('userId actions')
    .then(histories => {
        const response = {
            msg: 'success',
            length: histories.length,
            histories: histories.map(history => {
                return {
                    _id: history._id,
                    userId: history.userId,
                    actions: history.actions,
                    request: {
                        type: 'GET',
                        url: req.hostname + '/histories/' + history.userId
                    }
                }
            })
        }

        // res.set("x-total-count", codes.length);
        res.status(200).json(response)
    })
    .catch(error => {
        console.log(error)
        res.status(500).json({
            msg: 'Server error!',
            error
        })
    })
}

exports.getOne = (req, res, next) => {
    const {userId} = req.params

    // if (req.userData.roles != 'admin'){
    //     return res.status(403).json({
    //         msg: `You don't have the permission!`
    //     })
    // }

    History.find({userId})
    .select('_id userId actions')
    .then(history => {

        if(!history[0]){
            return res.status(404).json({
                msg: 'History not found!'
            })
        }

        history = history[0]

        res.status(200).json({
            msg: "success",
            history: {
                _id: history._id,
                userId: history.userId,
                actions: history.actions,
                request: {
                    type: 'GET',
                    url: req.hostname + '/histories'
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
    const {userId} = req.body

    if(!userId){
        return res.status(400).json({
            msg: 'Bad request body!'
        })
    }

    // if (req.userData.roles != 'admin'){
    //     return res.status(403).json({
    //         msg: `You don't have the permission!`
    //     })
    // }

    const history = new History({
        userId,
        actions: {
            accInfos: [],
            items: [],
            rolls: [],
            codes: []
        }
    })

    history.save()
    .then(his => {
        res.status(201).json({
            msg: "success",
            history: {
                _id: his._id,
                userId: his.userId,
                actions: his.actions,
                request: {
                    type: 'GET',
                    url: req.hostname + '/histories/' + his.userId
                }
            }
        })
    })
    .catch(error => {
        res.status(500).json({
            msg: 'Server error!',
            error
        })
    })
}

// // Updating
// exports.use = (req, res, next) => {
//     const {codeId} = req.params
//     const {_id} = req.body

//     let userItems = {
//         userId: '',
//         items: []
//     }

//     User.findById({_id})
//     .then(user => {
//         if(!user){
//             return res.status(400).json({
//                 msg: 'User not found!'
//             })
//         }

//         userItems.userId = user._id
//     })
//     .catch(error => {
//         res.status(500).json({
//             msg: 'Server error!',
//             error
//         })
//     })

//     Code.findById({_id: codeId})
//     .then(code => {
//         if(!code){
//             return res.status(400).json({
//                 msg: 'Code not found!'
//             })
//         }

//         if(code.isUsed){
//             return res.status(400).json({
//                 msg: 'The code has been used!'
//             })
//         }

//         // map
//         for (const _id of code.items){
//             Item.findById(_id)
//             .then(item => {
//                 // can be change
//                 if(item){
//                     userItems.items.push(item.name)

//                     // call model user-items .push item
//                 }

//             })
//             .catch(error => {
//                 return res.status(500).json({
//                     msg: 'Server error!',
//                     error
//                 })
//             })
//         }

//         code.isUsed = true

//         code.save()

//         res.status(200).json({
//             msg: 'success'
//         })
//     })
//     .catch(error => {
//         res.status(500).json({
//             msg: 'Server error!',
//             error
//         })
//     })
// }

// exports.update = (req, res, next) => {
//     const {codeId: _id} = req.params

//     if (req.userData.roles != 'admin'){
//         return res.status(403).json({
//             msg: `You don't have the permission!`
//         })
//     }

//     const code = {}

//     for (const ops of req.body) {
//         code[ops.propName] = ops.value
//     }

//     Code.updateOne({_id}, {$set: code})
//     .then(result => {
//         res.status(200).json({
//             msg: "success",
//             request: {
//                 type: 'GET',
//                 url: req.hostname + '/giffcodes/' + _id
//             }
//         })
//     })
//     .catch(error => {
//         console.log(error)
//         res.status(500).json({
//             msg: 'Server error!',
//             error
//         })
//     })
// }

// exports.delete = (req, res, next) => {
//     const {codeId: _id} = req.params

//     if (req.userData.roles != 'admin'){
//         return res.status(403).json({
//             msg: `You don't have the permission!`
//         })
//     }

//     Code.deleteOne({_id})
//     .then(result => {
//         res.status(200).json({
//             msg: 'success',
//             request: {
//                 type: 'POST',
//                 url: req.hostname + '/giffcodes',
//                 body: {
//                     code: 'String',
//                     type: 'String',
//                     items: 'Array of Item id',
//                     expiresTime: 'Number (millisecond)'
//                 }
//             }
//         })
//     })
//     .catch(error => {
//         console.log(error)
//         res.status(500).json({
//             msg: 'Server error!',
//             error
//         })
//     })
// }