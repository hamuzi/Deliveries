const pool = require("../db/pool");

class Delivery{
    // create delivery into DB 
    static async create({ name, phone, address }) {
    const query = `
      INSERT INTO deliveries (name, phone, address, status)
      VALUES ($1, $2, $3, 'CREATED')
      RETURNING id, name, phone, address, status, created_at, updated_at;
    `;

    const values = [name, phone, address];
    const result = await pool.query(query, values);
    return result.rows[0];
    }

    // return delivery object by id from DB
    static async findById(id) {
        const query = `
        SELECT id, name, phone, address, status, created_at, updated_at
        FROM deliveries
        WHERE id = $1;
        `;

        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    // update status by id delivery into DB
    static async updateStatus(id, nextStatus) {
        const query = `
        UPDATE deliveries
        SET status = $2, updated_at = now()
        WHERE id = $1
        RETURNING id, status, updated_at;
        `;

        const result = await pool.query(query, [id, nextStatus]);
        return result.rows[0] || null;
    }

    // get all deliveries from DB
    static async listAll(){
        const query = `SELECT *
        FROM deliveries
        ORDER BY created_at DESC`
        ;

        const result = await pool.query(query);
        return result.rows;
    }

    // assign driver to delivery by id's to DB
    static async assignDriver(id, driverId) {
        const query = `
            UPDATE deliveries
            SET driver_id = $2,
                status = 'ASSIGNED',
                updated_at = now()
            WHERE id = $1
            RETURNING id, driver_id, status, updated_at;
        `;

        const result = await pool.query(query, [id, driverId]);
        return result.rows[0] || null;
    }

    // find all available deliveries for drivers from DB
    static async findAvailable() {
        const query = `
        SELECT id, name, address, status, created_at
        FROM deliveries
        WHERE status = 'READY_FOR_PICKUP'
        ORDER BY created_at ASC;
    `;

        const result = await pool.query(query);
        return result.rows;
    }

    // find deliveries by driver info. from DB
    static async findByDriver(driverId) {
        const query = `
            SELECT id, name, address, status, created_at, updated_at
            FROM deliveries
            WHERE driver_id = $1
            ORDER BY created_at DESC;
        `;

        const result = await pool.query(query, [driverId]);
        return result.rows;
    }  
    
    // find specific delivery by driver id and delivery id from DB
    static async findByIdAndDriver(id, driverId) {
        const query = `
            SELECT id, name, phone, address, status, driver_id, created_at, updated_at
            FROM deliveries
            WHERE id = $1 AND driver_id = $2;
        `;

        const result = await pool.query(query, [id, driverId]);
        return result.rows[0] || null;
    }
}

module.exports = Delivery;