"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

class Image {

static async save({fileName, filePath, tripId, caption, tag1, tag2, tag3 }) {

    const result = await db.query(
        `INSERT INTO images
         (file_name, file_path, trip_id, caption, tag1, tag2, tag3)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
      [
          title,
          userId
      ],
  );
  const trip = result.rows[0];

  return trip;


}




}

export default Image;