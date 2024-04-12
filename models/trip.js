"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/** Related functions for trips. */

class Trip {
  /** Create a trip (from data), update db, return new trip data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if trip already in database.
   * */

  static async create({ title, userId }) {
 
    const result = await db.query(
          `INSERT INTO trips
           (title, user_id)
           VALUES ($1, $2)
           RETURNING id, title, user_id AS "userId"`,
        [
            title,
            userId
        ]
    );
    const trip = result.rows[0];

    return trip;
  }

  /** Find all trips.
   *
   * Returns [{id, title, userId, username, profImage, images }, ...]
   * where images is [{fileUrl, caption, tag1, tag2, tag3}, ...]
   * */

  static async findAll() {
    try {
        let query = `SELECT t.id,
                            t.title,
                            t.user_id AS "userId",
                            u.username,
                            u.profile_image AS "profImage"
                     FROM trips AS "t"
                     JOIN users AS "u" ON t.user_id = u.id
                     ORDER BY t.id DESC`;

        const result = await db.query(query);

        if (!result.rows || result.rows.length === 0) return []; // Return an empty array if no rows found

        for (let row of result.rows) {
            const images = await db.query(
                `SELECT file_url AS "fileUrl",
                 caption, tag1, tag2, tag3 
                 FROM images
                 WHERE trip_id = $1
                 ORDER BY id`,
                [row.id]
            );
            console.log('Images:', images.rows);
            if (images.rows && images.rows.length > 0) {
              row.images = images.rows;
          } else {
              row.images = []; // Set an empty array if no images found
          }
        }
        return result.rows;
    } catch (error) {
        console.error("Error in findAll method:", error.message);
        throw error; // Re-throw the error for the caller to handle
    }
  }


  /** Given a trip id, return that trip, as well as all images
   * with that trip id.
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const tripRes = await db.query(
          `SELECT t.id,
                  t.title,
                  t.user_id AS "userId",
                  u.username
           FROM trips AS "t"
           JOIN users AS "u" ON t.user_id = u.id
           WHERE t.id = $1`,
        [id]);

    const trip = tripRes.rows[0];

    if (!trip) throw new NotFoundError(`No trip: ${id}`);

    const imagesRes = await db.query(
          `SELECT id,
                  file_url AS "fileUrl",         
                  caption,
                  tag1,
                  tag2,
                  tag3
           FROM images
           WHERE trip_id = $1
           ORDER BY id`,
        [id],
    );

    trip.images = imagesRes.rows;

    return trip;
  }

  /** Add image to an existing trip.
   *
   * Throws NotFoundError if not found.
   */

  static async addImage(tripId, image) {
    const {file_url,
           caption,
            tag1, tag2, tag3 } = image;

    const result = await db.query(`INSERT INTO images
                                (file_url, trip_id, caption,
                                 tag1, tag2, tag3)
                                 VALUES
                                 ($1, $2, $3, $4, $5, $6)
                                 RETURNING id`,
                                 [file_url, tripId, caption,
                                  tag1, tag2, tag3]);

    const imageId = result.rows[0];

    return imageId;
  }

  static async getTripImages(tripId) {
    const result = await db.query(`SELECT *
                                   FROM images
                                   WHERE trip_id = $1
                                   ORDER BY id`,
                                   [tripId]);
    return result.rows;
  }

  /** Delete given trip from database; returns undefined.
   *
   * Throws NotFoundError if trip not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM trips
           WHERE id = $1
           RETURNING id`,
        [id]);
    const trip = result.rows[0];

    if (!trip) throw new NotFoundError(`No trip: ${id}`);
  }
}


module.exports = Trip;

// `SELECT t.id,
// t.title,
// t.user_id AS "userId",
// i.file_name AS "fileName",
// i.file_path AS "filePath",
// i.caption,
// i.tag1,
// i.tag2,
// i.tag3
// FROM trips AS "t"
// JOIN images AS "i" ON t.id = i.trip_id
// WHERE t.id = $1`,