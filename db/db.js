import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const URL = "mongodb+srv://sanskarsinha:qwerty12345@ecom.xg97s3o.mongodb.net/SocialMedia"
        const conn = await mongoose.connect(URL);
        if (conn) {
            console.log(`Connected to DB ${conn.connection.host}`);
        }
        else {
            console.log(`Failed to connect DB`);
        }
    }
    catch (err) {
        console.log(err);
    }
}

export default connectDB;