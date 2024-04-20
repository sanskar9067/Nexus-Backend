import express from 'express';
import connectDB from './db/db.js';
import multer from 'multer';
import userModel from './model/userModel.js';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import postModel from './model/postModel.js';
import Conversation from './model/conversation.js'
import Message from './model/messages.js'

const app = express();
app.use(morgan(`dev`));
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
})

const upload = multer({ storage });

const PORT = 8000;

connectDB();

app.get("/", (req, res) => {
    res.send("Hello World");
})

app.post("/register", upload.single('file'), async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await userModel.findOne({ email: email });
        if (existingUser) {
            res.status(500).send({
                success: false,
                message: "User already registered"
            });
        }
        else {
            const location = `${req.file.filename}`;
            const data = await userModel({ name, email, password, location }).save();
            if (data) {
                res.status(200).send({
                    success: true,
                    message: "User Registered"
                })
            }
            else {
                res.status(400).send({
                    success: false,
                    message: "User Not Registered"
                })
            }
        }
    }
    catch (err) {
        console.log(err);
        res.status(400).send({
            success: false,
            message: "Something Went Wrong"
        })
    }
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email: email });
    if (user) {
        if (user.password === password) {
            const token = await jwt.sign({ _id: user._id }, 'BCKWJBFWIO9CNL', { expiresIn: '7d' });
            res.status(200).send({
                success: true,
                message: "Log In Successful",
                user: user,
                token: token
            })
        }
        else {
            res.status(500).send({
                success: false,
                message: "Wrong Password",
            })
        }
    }
    else {
        res.status(400).send({
            success: false,
            message: "User Not Registered",
        })
    }
})

app.post("/uploadpost", upload.single('file'), async (req, res) => {
    try {
        const { pid, photo, name, email, post } = req.body;
        const location = `${req.file.filename}`;
        const uploadPost = await postModel({ pid, photo, name, email, post, location }).save();
        if (uploadPost) {
            res.status(200).send({
                success: true,
                message: "Post Uploaded"
            })
        }
        else {
            res.status(500).send({
                success: false,
                message: "Something Went Wrong"
            })
        }
    }
    catch (err) {
        console.log(err);
    }
})

app.get("/getpost", (req, res) => {
    postModel.find()
        .sort({ _id: -1 })
        .then(post => res.json(post))
        .catch(err => console.log(err));
})

app.post("/forgotpassword", async (req, res) => {
    const { email, newpassword } = req.body;
    const user = await userModel.findOneAndUpdate({ email: email }, { $set: { password: newpassword } }, { new: false });
    if (user) {
        res.status(200).send({
            success: true,
            message: "Password Changed"
        })
    }
    else {
        res.status(500).send({
            success: false,
            message: "User Not Found"
        })
    }
})

app.post("/like", async (req, res) => {
    const { actualid, postid, lid } = req.body;
    try {
        const post = await postModel.findOne({ _id: actualid });
        if (!post) {
            return res.status(400).send({
                success: false,
                message: "Post not found"
            });
        }


        const alreadyLiked = post.likes.some(like => like.id === lid);
        if (alreadyLiked) {
            return res.status(400).send({
                success: false,
                message: "You have already liked this post"
            });
        }


        post.likes.push({ id: lid });
        const updatedPost = await post.save();

        res.status(200).send({
            success: true,
            message: "Post Liked",
            likes: updatedPost.likes.length
        });
    } catch (error) {
        console.error("Error liking post:", error);
        res.status(500).send({
            success: false,
            message: "Internal Server Error"
        });
    }
});

app.get("/yourpost", async (req, res) => {
    try {
        const { id } = req.query;
        const post = await postModel.find({ pid: id }).sort({ _id: -1 });
        res.json(post);
    }
    catch (err) {
        console.log(err);
    }
});

app.get("/getpostdetails/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const det = await postModel.findOne({ _id: id });
        res.json(det);
    }
    catch (err) {
        console.log(err);
    }
})

app.post("/addcomment", async (req, res) => {
    try {
        const { id, name, comment } = req.body;
        if (!id || !name || !comment) {
            return res.status(400).send({
                success: false,
                message: "Invalid input data"
            });
        }

        const post = await postModel.findById(id);
        if (!post) {
            return res.status(404).send({
                success: false,
                message: "Post not found"
            });
        }

        post.comments.push({ name: name, text: comment });

        const updatedPost = await post.save();
        console.log(updatedPost);
        if (updatedPost) {
            return res.status(200).send({
                success: true,
                message: "Comment added successfully"
            });
        } else {
            return res.status(500).send({
                success: false,
                message: "Failed to save comment"
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            success: false,
            message: "Internal server error"
        });
    }
});

app.post("/deletepost", async (req, res) => {
    try {
        const { id } = req.body;
        const del = await postModel.findOneAndDelete({ _id: id });
        if (del) {
            res.status(200).send({
                success: true,
                message: "Post Deleted"
            })
        }
        else {
            res.status(400).send({
                success: true,
                message: "Something Went Wrong"
            })
        }
    }
    catch (err) {
        console.log(err);
    }
})

app.post("/searchuser", async (req, res) => {
    try {
        const { user } = req.body;
        const userDet = await userModel.find({ name: user });

        if (userDet) {
            res.status(200).send({
                success: true,
                message: "User Found",
                user: userDet
            })
        }

        else {
            res.status(400).send({
                success: false,
                message: "User Not Found",
            })
        }
        console.log(userDet);
    }
    catch (err) {
        res.status(400).send({
            success: false,
            message: "Something Went Wrong",
        })
    }

})

app.get("/userdetails/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const detailsUser = await userModel.findOne({ _id: id });
        if (detailsUser) {
            const postData = await postModel.find({ pid: id }).sort({ _id: -1 });
            res.status(200).send({
                success: true,
                message: "User Details Shown",
                user: detailsUser,
                posts: postData
            })
        } else {
            res.status(500).send({
                success: false,
                message: "Something Went Wrong"
            })
        }
    }
    catch (err) {
        console.log(err);
    }
})

app.post("/updatephoto", upload.single('file'), async (req, res) => {
    try {
        const { id } = req.body;
        const newLocation = `${req.file.filename}`;
        const userProfile = await userModel.findOneAndUpdate({ _id: id }, { $set: { location: newLocation } }, { new: false });
        const userProfilePost = await postModel.findOneAndUpdate({ pid: id }, { $set: { photo: newLocation } }, { new: false });
        if (userProfile) {
            res.status(200).send({
                success: true,
                message: "Profile Photo Updated",
            })
        }
        else {
            res.status(500).send({
                success: false,
                message: "Something went Wrong",
            })
        }

    }
    catch (err) {
        console.log(err);
    }
})

app.post("/follow", async (req, res) => {
    try {
        const { authId, userId, authName, userName, authProfilePhoto, userProfilePhoto, authEmail, userEmail } = req.body;
        const userFind = await userModel.findOne({ _id: userId });
        const alreadyFollowed = userFind.followers.some(like => like.id === authId);
        if (alreadyFollowed) {
            return res.status(400).send({
                success: false,
                message: "You have already followed"
            });
        } else {
            userFind.followers.push({ id: authId, name: authName, profilePhoto: authProfilePhoto, email: authEmail });
            const updatedPost1 = await userFind.save();

            const authFind = await userModel.findOne({ _id: authId });
            authFind.following.push({ id: userId, name: userName, profilePhoto: userProfilePhoto, email: userEmail });
            const updatedPost2 = await authFind.save();
            res.status(200).send({
                success: true,
                message: "Followed Successfully"
            })
            console.log(userFind);
            console.log(authFind);
        }

    }
    catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "Something Went Wrong"
        })
    }
})

app.post("/getfollowers", async (req, res) => {
    try {
        const { id } = req.body;
        const getFollowers = await userModel.findOne({ _id: id });
        if (getFollowers) {
            res.status(200).send({
                success: true,
                followers: getFollowers.followers
            })
        }
    }
    catch (err) {
        console.log(err);
    }
})

app.post("/getfollowing", async (req, res) => {
    try {
        const { id } = req.body;
        const getFollowing = await userModel.findOne({ _id: id });
        if (getFollowing) {
            res.status(200).send({
                success: true,
                following: getFollowing.following
            })
        }
    }
    catch (err) {
        console.log(err);
    }
})

app.post("/chatusers", async (req, res) => {
    try {
        const { id } = req.body;
        const chatUsers = await userModel.find({ _id: { $ne: id } });
        res.status(200).send({
            success: true,
            chatUsers: chatUsers
        })

    } catch (error) {
        console.log(error);
    }
})


app.post("/sendmessage", async (req, res) => {
    try {
        const { senderId, receiverId, message } = req.body;
        if (!message) {
            return res.status(400).send({
                success: false,
                message: "Enter the message"
            });
        }
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            message,
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);
        }
        await Promise.all([conversation.save(), newMessage.save()]);
        res.status(201).json(newMessage);
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({
            success: false,
            message: "Internal Server Error"
        });
    }
});

app.post("/getmessages", async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;
        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate('messages');
        if (!conversation) {
            return res.status(200).json([]);
        }
        const messages = conversation.messages;
        res.status(200).send({
            messages: messages
        });
    }
    catch (err) {
        console.log(err);
    }
})

app.listen(PORT, () => {
    console.log(`Server started on port: ${PORT}`);
})