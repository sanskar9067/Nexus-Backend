import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    pid: String,
    photo: String,
    name: String,
    email: String,
    post: String,
    location: String,
    likes: [{ id: String }],
    comments: [{ name: String, text: String }]
})

export default mongoose.model("posts", postSchema);