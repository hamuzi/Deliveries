const pool = require("../db/pool");

class Delivery{
    // create delivery into DB 
    static async create({ name, phone, address }, user) {
    const query = `
      INSERT INTO deliveries (name, phone, address, status, business_id)
      VALUES ($1, $2, $3, 'CREATED', $4)
      RETURNING id, name, phone, address, status, business_id, created_at, updated_at ;
    `;

    const values = [name, phone, address, user.sub];
    const result = await pool.query(query, values);
    return result.rows[0];
    }

    // return delivery object by id from DB
    static async findById(id, user) {
        const groups = user.groups || [];
        if (groups.includes("ADMIN")){
            const query = `SELECT * FROM deliveries
            WHERE id = $1`
            const result = await pool.query(query, [id]);
            return result.rows[0] || null;
        }
        if (groups.includes("DRIVER")){
            const query = `SELECT * FROM deliveries
            WHERE id = $1 AND driver_id = $2`
            const result = await pool.query(query, [id, user.sub]);
            return result.rows[0] || null;
        }
         if (groups.includes("BUSINESS")){
            const query = `SELECT * FROM deliveries
            WHERE id = $1 AND business_id = $2`
            const result = await pool.query(query, [id, user.sub]);
            return result.rows[0] || null;
        }
        return null;
    }

    // update status by id delivery into DB
    static async updateStatus(id, nextStatus, user) {
        const groups = user.groups || [];
        if (groups.includes("ADMIN")){
            const query = `UPDATE deliveries
            SET status = $2, updated_at = now()
            WHERE id = $1
            RETURNING id, status, updated_at;`;
            const result = await pool.query(query,[id, nextStatus]);
            return result.rows[0] || null;
        }
        if (groups.includes("BUSINESS")){
            const query = `UPDATE deliveries
            SET status = $2, updated_at = now()
            WHERE id = $1 AND business_id = $3
            RETURNING id, status, updated_at, business_id;`
            const result = await pool.query(query, [id, nextStatus, user.sub]);
            return result.rows[0] || null;
        }
        if (groups.includes("DRIVER")){
            const query = `UPDATE deliveries
            SET status = $2, updated_at = now()
            WHERE id = $1 AND driver_id = $3
            RETURNING id, status, updated_at, driver_id;`
            const result = await pool.query(query, [id, nextStatus, user.sub]);
            return result.rows[0] || null;
        }
        return null;         
    }

    // get all deliveries from DB
    static async listAll(user){
        const groups = user.groups || [];
        if (groups.includes("ADMIN")){
            const query = `SELECT * FROM deliveries
            ORDER BY created_at DESC`
            const result = await pool.query(query);
            return result.rows;
        }
        if (groups.includes("DRIVER")){
            const query = `SELECT * FROM deliveries 
            WHERE driver_id = $1
            ORDER BY created_at DESC`
            const result = await pool.query(query, [user.sub]);
            return result.rows;
        }
        if (groups.includes("BUSINESS")){
            const query = `SELECT * FROM deliveries 
            WHERE business_id = $1
            ORDER BY created_at DESC`
            const result = await pool.query(query, [user.sub]);
            return result.rows;
        }
        return [];
    }

    // assign driver to delivery by id's to DB
    static async assignDriver(id, user) {
        const groups = user.groups || [];
        if (groups.includes("ADMIN") || groups.includes("DRIVER")){
            const query = `
                UPDATE deliveries
                SET driver_id = $2,
                status = 'ASSIGNED',
                updated_at = now()
                WHERE id = $1
                AND status = 'READY_FOR_PICKUP'
                AND driver_id IS NULL
                RETURNING id, driver_id, status, updated_at;`;
            const result = await pool.query(query, [id,user.sub]);
            return result.rows[0] || null;
        }
        return null;
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
}

module.exports = Delivery;