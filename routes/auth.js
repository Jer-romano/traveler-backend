"use strict";

/** Routes for authentication. */

const jsonschema = require("jsonschema");

const User = require("../models/user");
const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");

const router = new express.Router();

const { createToken } = require("../helpers/tokens");
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
const userAuthSchema = require("../schemas/userAuth.json");
const userRegisterSchema = require("../schemas/userRegister.json");
const { BadRequestError } = require("../expressError");

AWS.config.update({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  region: 'us-east-2'
})

// Set up Multer for file uploads
const s3 = new AWS.S3({httpOptions: {timeout: 10000}});
const storage = multer.memoryStorage();

const upload = multer({storage: storage});

/** POST /auth/token:  { username, password } => { token }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/token", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userAuthSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const { username, password } = req.body;
    const user = await User.authenticate(username, password);
    const token = createToken(user);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});


/** POST /auth/register:   { user } => { token }
 *
 * user must include { username, password, firstName, lastName }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/register", upload.single('profImage'), async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userRegisterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const file = req.file;

    // Check if file exists
    if (!file) {
      try {
            //Insert User into DB
            const newUser = await User.register({ 
              ...req.body,
               profImage: "https://traveler-capstone-images.s3.us-east-2.amazonaws.com/profileimages/defaultUser.jpeg" });
            const token = createToken(newUser);
    
            //res.send(`File Uploaded Successfully: URL: ${data.Location}`);
            return res.status(201).json({ token });
      } catch(err) {
        return next(err);
      }
    }

    const folder = "profileimages/";

    const params = {
      Bucket: 'traveler-capstone-images',
      Key: folder + file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype
    };
  
    // Upload the file to S3
    s3.upload(params, async (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error uploading image to S3');
      }
  
      try {
        //Insert User into DB
        const newUser = await User.register({ 
          ...req.body, profImage: data.Location });
        const token = createToken(newUser);

        //res.send(`File Uploaded Successfully: URL: ${data.Location}`);
        return res.status(201).json({ token });

      } catch (err) {
        return next(err);
      }
    });

  } catch (err) {
    return next(err);
  }
});


module.exports = router;
