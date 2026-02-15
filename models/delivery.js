const pool = require("../db/pool");

class Delivery{
    // create delivery into DB - static async function
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

    // return delivery object by id
    static async findById(id) {
        const query = `
        SELECT id, name, phone, address, status, created_at, updated_at
        FROM deliveries
        WHERE id = $1;
        `;

        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    // update status by id delivery
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

    // get all deliveries
    static async listAll(){
        const query = `SELECT *
        FROM deliveries
        ORDER BY created_at DESC`
        ;

        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = Delivery;