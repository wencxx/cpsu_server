const mongoose = require('mongoose')


const idCardSchema = new mongoose.Schema({
    idNumber: String,
    fullName: String,
    courseYear: String,
    address: String,
    number: Number,
    birthday: Date,
    guardianName: String,
    guardianContact: Number,
    scheduleDate: Date,
    status: {
        type: String,
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    userId: String
})

module.exports = mongoose.model('idCardApplicaton', idCardSchema)