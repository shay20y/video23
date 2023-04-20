const express = require("express");
const { authAdmin } = require("../middlewares/auth");
const { CategoryModel, validateCategory } = require("../models/categoryModel");
const router = express.Router();


router.get("/", async (req, res) => {
  let perPage = req.query.perPage || 5;
  let page = req.query.page - 1 || 0;
  let sort = req.query.sort || "_id";
  let reverse = req.query.reverse == "yes" ? 1 : -1;

  try {
      let data = await CategoryModel
          .find({})
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

router.get("/count" , async(req,res) => {
  try{
    let perPage = req.query.perPage || 5;
    // יקבל רק את כמות הרשומות בקולקשן
    const count = await CategoryModel.countDocuments({})
    res.json({count,pages:Math.ceil(count/perPage)})
  }
  catch(err){
    console.log(err);
    res.status(502).json({err})
  }
})

router.get("/single/:id", async (req, res) => {
  try {
    const id = req.params.id
    let data = await CategoryModel.findOne({ _id: id });
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.post("/",authAdmin, async (req, res) => {
  let validBody = validateCategory(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let category = new CategoryModel(req.body);
    await category.save();
    res.json(category)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.put("/:id",authAdmin, async (req, res) => {
  let validBody = validateCategory(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let id = req.params.id;
    let data = await CategoryModel.updateOne({ _id: id }, req.body);
    res.json(data)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.delete("/:id",authAdmin, async (req, res) => {
  try {
    let id = req.params.id;
    let data = await CategoryModel.deleteOne({ _id: id });
    res.json(data)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

module.exports = router;