const mongoose = require('mongoose')

const goodMoral = new mongoose.Schema({
    orNumber: String,
    fullName: String,
    courseYear: String,
    number: Number,
    gender: String,
    syGraduated: String,
    syCurrentlyEnrolled: String,
    selectedDate: Date,
    purpose: String,
    claimed: {
        type: Boolean,
        required: false,
        default: false
    },
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

module.exports = mongoose.model('goodMoralRequests', goodMoral)