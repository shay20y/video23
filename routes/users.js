const express = require("express");
const bcrypt = require("bcrypt");
const { auth, authAdmin } = require("../middlewares/auth");
const { validateJoi, UserModel, validateLogin, createToken } = require("../models/userModel");
const { admin } = require("../config/adminUsers");

const router = express.Router();

router.get("/", async (req, res) => {
  res.json({ msg: "Users endpoint" });
})

// ראוט שבודק את הטוקן בלי להפעיל את המסד
router.get("/checkToken",auth , async(req,res) => {
  res.json({_id:req.tokenData._id,role:req.tokenData.role})
})

router.get("/userInfo", auth, async (req, res) => {
  try {
    let user = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 })
    res.json(user)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/usersList", authAdmin, async (req, res) => {
  try {
    let perPage = req.query.perPage || 5;
    let page = req.query.page - 1 || 0;
    let data = await UserModel
      .find({}, { password: 0 })
      .limit(perPage)
      .skip(page * perPage)
      .sort({ _id: -1 })
    res.json(data)
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
    const count = await UserModel.countDocuments({})
    res.json({count,pages:Math.ceil(count/perPage)})
  }
  catch(err){
    console.log(err);
    res.status(502).json({err})
  }
})

router.post("/", async (req, res) => {
  let validBody = validateJoi(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let user = new UserModel(req.body);
    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    user.password = "******"
    res.status(201).json(user);
  }
  catch (err) {
    if (err.code == 11000) {
      return res.status(400).json({ msg: "Email already in system", code: 11000 })
    }
    console.log(err);
    res.status(502).json({ err })
  }
})

router.post("/login", async (req, res) => {
  let validBody = validateLogin(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ err: "Email not found" });
    }
    let passwordValid = await bcrypt.compare(req.body.password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ err: "Password worng" });
    }
    let token = createToken(user._id, user.role)
    return res.json({ token })
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.delete("/:id", authAdmin, async (req, res) => {
  try {
    let id = req.params.id;
    if (id == req.tokenData._id || id == admin) {
      return res.status(401).json({ err: "You cant delete yourself or the super admin" });
    }
    let data = await UserModel.deleteOne({ _id: id });
    res.json(data)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

// patch -> עדכון מאפיין אחד ברשומה אחת
router.patch("/changeRole/:id/:role", authAdmin, async (req, res) => {
  const id = req.params.id;
  const newRole = req.params.role;
  try {
    if (id == req.tokenData._id || id == admin) {
      return res.status(401).json({ err: "You cant change your role! or the super admin" })
    }
    const data = await UserModel.updateOne({ _id: id }, { role: newRole })
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }

})

module.exports = router;