import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    location: String,
    followers: [{ id: String, name: String, profilePhoto: String, email: String }],
    following: [{ id: String, name: String, profilePhoto: String, email: String }]
});

export default mongoose.model("users", userSchema);