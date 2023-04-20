const express = require("express");
const { auth } = require("../middlewares/auth");
const { VideoModel, validateVideo } = require("../models/videoModel");
const router = express.Router();

router.get("/", async (req, res) => {
    const perPage = req.query.perPage || 5;
    const page = req.query.page - 1 || 0;
    const sort = req.query.sort || "_id";
    const reverse = req.query.reverse == "yes" ? 1 : -1;
    const category = req.query.category;
    const user_id = req.query.user_id;


    try {
        let filterFind = {};
        if (category) {
            filterFind = { category_code: category }
        }
        else if(user_id){
            filterFind = {user_id}
        }
        const data = await VideoModel
            .find(filterFind)
            .limit(perPage)
            .skip(page * perPage)
            .sort({ [sort]: reverse })
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }
})

router.get("/single/:id", async (req, res) => {
    try {
        const id = req.params.id
        const data = await VideoModel.findOne({ _id: id });
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }
})

router.post("/", auth, async (req, res) => {
    const validBody = validateVideo(req.body);
    if (validBody.error) {
        return res.status(400).json(validBody.error.details);
    }
    try {
        const video = new VideoModel(req.body);
        video.user_id = req.tokenData._id
        await video.save();
        res.json(video)
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }
})

router.put("/:id", auth, async (req, res) => {
    const validBody = validateVideo(req.body);
    if (validBody.error) {
        return res.status(400).json(validBody.error.details);
    }
    try {
        const id = req.params.id;
        let data;
        if (req.tokenData.role == "admin") {
            data = await VideoModel.updateOne({ _id: id }, req.body);
        }
        else {
            data = await VideoModel.updateOne({ _id: id, user_id: req.tokenData._id }, req.body);
        }
        res.json(data)
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }
})

router.delete("/:id", auth, async (req, res) => {
    try {
        const id = req.params.id;
        let data;
        if (req.tokenData.role == "admin") {
            data = await VideoModel.deleteOne({ _id: id });
        }
        else {
            data = await VideoModel.deleteOne({ _id: id, user_id: req.tokenData._id });
        }
        res.json(data)
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }
})

module.exports = router;