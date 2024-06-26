"use strict";

/** Routes for trips. */

const jsonschema = require("jsonschema");
const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');
const { BadRequestError } = require("../expressError");
const Trip = require("../models/trip");
const tripNewSchema = require("../schemas/tripNew.json");

let ACCESS_KEY_ID, SECRET_ACCESS_KEY;

if(process.env.NODE_ENV === "production") {
  ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
  SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
}
else {
    const secrets = require("../secret");
    ACCESS_KEY_ID = secrets.ACCESS_KEY_ID;
    SECRET_ACCESS_KEY = secrets.SECRET_ACCESS_KEY;
}

const router = new express.Router();

AWS.config.update({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  region: 'us-east-2'
})

// Set up Multer for file uploads
const s3 = new AWS.S3({httpOptions: {timeout: 10000}});
const storage = multer.memoryStorage();

const upload = multer({storage: storage});

/** POST / { trip } =>  { trip }
 *
 * trip should be { title, userId }
 *
 * Returns { id, title, userId }
 */

router.post("/", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, tripNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const trip = await Trip.create(req.body);
    return res.status(201).json({ trip });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { trips: [ { id, title, userId }, ...] }
 *
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {

    const trips = await Trip.findAll();
    return res.json({ trips });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { trip }
 *
 *  trip is { id, title, userId, images }
 *  where images is [{id, file, caption, tag1, tag2, tag3}, ...]
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const trip = await Trip.get(req.params.id);

    ////console.log("Images", trip.images);

    return res.json({ trip });

  } catch (err) {
    return next(err);
  }
});


/** POST /[id] { fld1, fld2, ... } => { trip }
 *
 * Add image to trip
 * Generates tags using the Google Cloud Vision API
 * Then uploads the image to AWS S3 bucket
 * Then saves S3 URL in the DB along with tags
 * fields can be: { file, caption, tag1, tag2, tag3}
 *
 * Returns { imageId }
 */

router.post("/:id", upload.single('file'), async function (req, res, next) {
  
  const file = req.file;

  // Check if file exists
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }
  // Check if caption exists
  if(!req.body.caption) {
    return res.status(400).send('No caption for file.');
  }

  // Check if file has the required properties
  if (!file.originalname || !file.buffer || !file.mimetype) {
    return res.status(400).send('Uploaded file is missing required properties.');
  }
  const ldmkArray = await landmarkDetection(file.buffer);
  const tags = await labelDetection(file.buffer);

  let tagData;

  //If no landmark detected, simply generate labels for the image
  if(!ldmkArray || ldmkArray.length === 0) {
    tagData = {
      tag1: tags[0],
      tag2: tags[1],
      tag3: tags[2],
      tag4: tags[3],
      tag5: tags[4]
    }
  }
  else {
    console.log("Found Landmark");
     tagData = {
      tag1: ldmkArray[0].description,
      tag2: tags[0],
      tag3: tags[1],
      tag4: tags[2],
      tag5: tags[3]
    }
  }

  const folder = "tripimages/";

  const params = {
    Bucket: 'traveler-capstone-images',
    Key: folder + file.originalname + "-" + Date.now().toString(),
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
      let imageData = {
                      file_url: data.Location,
                      caption: req.body.caption,
                      ...tagData
      }
      await Trip.addImage(req.params.id, imageData);
      return res.status(201).send(`File uploaded successfully. URL: ${data.Location}`);
    } catch (err) {
      return next(err);
    }

  });

});

// async function labelDetection() {
//   // Creates a client
//   const client = new vision.ImageAnnotatorClient();
//   // Performs label detection on the image file
//   const [result] = await client.labelDetection('./wakeupcat.jpg');
//   const labels = result.labelAnnotations;
//   console.log('Labels:');
//   labels.forEach(label => console.log(label.description));
// }
// labelDetection();


async function labelDetection(image) {
  // Creates a client
  const client = new vision.ImageAnnotatorClient();
  // Performs label detection on the image file
  const [result] = await client.labelDetection(image);
  const labels = result.labelAnnotations;
  //console.log('Labels:');
 // labels.forEach(label => console.log(label.description));

  return labels.map(label => label.description);
}

async function landmarkDetection(image) {
  // Creates a client
  const client = new vision.ImageAnnotatorClient();
  // Performs label detection on the image file
  const [result] = await client.landmarkDetection(image);
  const landmarks = result.landmarkAnnotations;
  //console.log('Landmarks:');
  //landmarks.forEach(landmark => console.log(landmark));

  return landmarks;
}

/** GET /[id]/images => {images: []}
 * 
 * Get all images associated with a trip.
 * 
 * Returns { images }
 */

router.get("/:id/images", async function (req, res, next) {
  try {
    const images = await Trip.getTripImages(req.params.id);
    return res.json({ images });

  } catch(err) {
    return next(err);
  }
})

/** DELETE /[id]  =>  { deleted: id }
 *
 */
router.delete("/:id", async function (req, res, next) {
  try {
    await Trip.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
