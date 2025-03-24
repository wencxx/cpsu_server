const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://wncbtrn:wncbtrn@cluster0.lcj0p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/cpsu_appointment')

        console.log('Connected to database')
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = connectDB