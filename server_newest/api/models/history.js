const mongoose = require('mongoose')

const historySchema = mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: [true, 'UserId is required!']
    },
    actions: {
        accInfos: {
            personal: [
                {
                    type: String,
                }
            ],
            manage: [
                {
                    type: String,
                }
            ]
        },
        items: {
            personal: [
                {
                    type: String,
                }
            ],
            manage: [
                {
                    type: String,
                }
            ]
        },
        rolls: {
            personal: [
                {
                    type: String,
                }
            ],
            manage: [
                {
                    type: String,
                }
            ]
        },
        codes: {
            personal: [
                {
                    type: String,
                }
            ],
            manage: [
                {
                    type: String,
                }
            ]
        },
        blogs: {
            personal: [
                {
                    type: String,
                }
            ],
            manage: [
                {
                    type: String,
                }
            ]
        }
    }
})

// Add plugins
historySchema.set('timestamps', true)

module.exports = mongoose.model('History', historySchema)