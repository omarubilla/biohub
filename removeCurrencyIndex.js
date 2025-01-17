const mongoose = require('mongoose');

async function removeIndex() {
    try {
        // Replace with your connection string
        const uri = "mongodb+srv://kevinubilla:Omarcito7!@cluster0.vo5iy.mongodb.net/test?retryWrites=true&w=majority";

        // Connect to the database
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("Connected to MongoDB");

        // Access the collection
        const db = mongoose.connection.db;
        const collection = db.collection("products");

        // Drop the index
        await collection.dropIndex("currency_1");
        console.log("Index removed successfully");

        // Close the connection
        mongoose.connection.close();
    } catch (error) {
        console.error("Error removing index:", error);
    }
}

removeIndex();