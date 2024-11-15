const properties = require("./json/properties.json");
const users = require("./json/users.json");

const {Pool} = require("pg");

const pool = new Pool({
    user: "development",
    password: "development",
    host: "localhost",
    database: "lightbnb",
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
    return pool
        .query(
            `SELECT *
             FROM users
             WHERE users.email = $1
            `, [email])
        .then((result) => {
            if (result.rows.length === 0) {
                return null;
            }
            return result.rows[0];
        })
        .catch((err) => {
            return Promise.reject(err);
        });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
    return pool
        .query(
            `SELECT *
             FROM users
             WHERE users.id = $1
            `, [id])
        .then((result) => {
            if (result.rows.length === 0) {
                return null;
            }
            return result.rows[0];
        })
        .catch((err) => {
            return Promise.reject(err);
        });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
    return getUserWithEmail(user.email)
        .then((existingUser) => {
            if (existingUser) {
                return Promise.reject("User with this email already exists");
            }
            return pool
                .query(
                    `INSERT INTO users (name, email, password)
                     VALUES ($1, $2, $3)
                     RETURNING *
                    `, [user.name, user.email, user.password])
                .then((result) => {
                    if (result.rows.length === 0) {
                        return null;
                    }
                    return result.rows[0];
                })
                .catch((err) => {
                    return Promise.reject(err);
                });
        });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @param limit
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
    return pool
        .query(
            `SELECT properties.*, AVG(property_reviews.rating) AS ratings, reservations.start_date
             FROM properties
                      INNER JOIN reservations ON properties.id = reservations.property_id
                      INNER JOIN property_reviews ON properties.id = property_reviews.property_id
             WHERE reservations.guest_id = $1
               AND reservations.end_date < now()::date
             GROUP BY properties.id, reservations.start_date
             ORDER BY reservations.start_date DESC
             LIMIT $2
            `, [guest_id, limit])
        .then((result) => {
            if (result.rows.length === 0) {
                return null;
            }
            return result.rows;
        })
        .catch((err) => {
            return Promise.reject(err);
        });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
    const queryParams = [];
    let whereStarted = false;

    let queryString = `
SELECT properties.*, AVG(property_reviews.rating) AS average_rating
FROM properties
INNER JOIN property_reviews ON properties.id = property_id`;

    if (options.city) {
        queryParams.push(`%${options.city}%`);
        queryString += `WHERE city LIKE $${queryParams.length} `;
        whereStarted = true;
    }

    if (options.owner_id) {
        queryParams.push(Number(options.owner_id));
        queryString += (whereStarted ? 'AND' : 'WHERE') + ` owner_id = $${queryParams.length} `;
        whereStarted = true;
    }

    if (options.minimum_price_per_night && options.maximum_price_per_night) {
        queryParams.push(options.minimum_price_per_night * 100);
        queryParams.push(options.maximum_price_per_night * 100);
        queryString += (whereStarted ? 'AND' : 'WHERE') + ` cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length} `;
        whereStarted = true;
    }

    queryString += `
GROUP BY properties.id, properties.cost_per_night`;

    if (options.minimum_rating) {
        queryParams.push(Number(options.minimum_rating));
        queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length} `;
    }

    queryParams.push(limit);

    queryString += `
ORDER BY cost_per_night
LIMIT $${queryParams.length};
`;

    console.log(queryString, queryParams);

    return pool
        .query(
            queryString, queryParams)
        .then((result) => {
            return Promise.resolve(result.rows);
        })
        .catch((err) => {
            return Promise.reject(err);
        });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
    const propertyId = Object.keys(properties).length + 1;
    property.id = propertyId;
    properties[propertyId] = property;
    return Promise.resolve(property);
};

module.exports = {
    getUserWithEmail,
    getUserWithId,
    addUser,
    getAllReservations,
    getAllProperties,
    addProperty,
    pool
};
