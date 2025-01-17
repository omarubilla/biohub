import mongoose from 'mongoose';

let isConnected = false;

export const connectToDB = async () => {
    mongoose.set('strictQuery', true);

    console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Loaded" : "Not defined");

    if(!process.env.MONGODB_URI) return console.log('MONGODB_URI is not defined');

    if(isConnected) return console.log('=> using existing database connection');

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);

        isConnected = true;

        console.log('MongoDB Connected');
    } catch (error) {
        console.log('Database connection error', error)
        isConnected = false;
    }
};

export {isConnected}