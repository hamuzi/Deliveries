const pool = require("../db/pool");
const DeliveryEvent = require("./deliveryEvent");

class Delivery{
    // create delivery into DB and log event
    static async create({ name, phone, address }, user) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const result = await client.query(
            `
            INSERT INTO deliveries (name, phone, address, status, business_id)
            VALUES ($1,$2,$3,'CREATED',$4)
            RETURNING *
            `,[name, phone, address, user.sub]);

            const delivery = result.rows[0];

            await DeliveryEvent.create({
                deliveryId: delivery.id,
                eventType: DeliveryEvent.TYPES.CREATED,
                previousStatus: null,
                newStatus: "CREATED",
                performedBy: user.sub,
                performedRole: JSON.stringify(user.groups || [])
            },client);

            await client.query("COMMIT");
            return delivery;

        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
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

    // update status by id delivery into DB and log events
    static async updateStatus(id, nextStatus, user) {
        const groups = user.groups || [];
        if(!(groups.includes("BUSINESS") || groups.includes("ADMIN") || groups.includes("DRIVER")))
            return null;

        const client = await pool.connect(); // for race condition
        try {
            await client.query("BEGIN");
            let query = `
            SELECT id, status
            FROM deliveries
            WHERE id = $1
            FOR UPDATE
            `;
            let values = [id];
            if (groups.includes("BUSINESS")) {
                query = `
                SELECT id, status
                FROM deliveries
                WHERE id = $1 AND business_id = $2
                FOR UPDATE
                `;
                values = [id, user.sub];
            }
            if (groups.includes("DRIVER")) {
                query = `
                SELECT id, status
                FROM deliveries
                WHERE id = $1 AND driver_id = $2
                FOR UPDATE
                `;
                values = [id, user.sub];
            }
            const beforeRes = await client.query(query, values);
            if (beforeRes.rows.length === 0) {
                await client.query("ROLLBACK");
                return null;
            }
            const previousStatus = beforeRes.rows[0].status;
            const updateRes = await client.query(
            `
            UPDATE deliveries
            SET status = $2,
            updated_at = now()
            WHERE id = $1
            RETURNING id, status, updated_at
            `,[id, nextStatus]);

            await DeliveryEvent.create({ // create delivery event for log
                deliveryId: id,
                eventType: DeliveryEvent.TYPES.STATUS_CHANGE,
                previousStatus,
                newStatus: nextStatus,
                performedBy: user.sub,
                performedRole: JSON.stringify(user.groups || [])
            },client);

            await client.query("COMMIT");
            return updateRes.rows[0];

        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
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

    // assign driver to delivery by id's to DB and log events
    static async assignDriver(id, user) {
        const groups = user.groups || [];
        if (!groups.includes("DRIVER")) 
            return null;

        const client = await pool.connect();

        try {
            await client.query("BEGIN");
            const beforeRes = await client.query(
            `SELECT id, status
            FROM deliveries
            WHERE id = $1
            AND status = 'READY_FOR_PICKUP'
            AND driver_id IS NULL
            FOR UPDATE`,[id]);

            if (beforeRes.rows.length === 0) {
                await client.query("ROLLBACK");
                return null;
            }

            const previousStatus = beforeRes.rows[0].status;
            const updateRes = await client.query(
            `UPDATE deliveries
            SET driver_id = $2,
            status = 'ASSIGNED',
            updated_at = now()
            WHERE id = $1
            AND status = 'READY_FOR_PICKUP'
            AND driver_id IS NULL
            RETURNING id, driver_id, status, updated_at`,[id, user.sub]);

            if (updateRes.rows.length === 0) {
                await client.query("ROLLBACK");
                return null;
            }

            await DeliveryEvent.create(
            {
                deliveryId: id,
                eventType: DeliveryEvent.TYPES.ASSIGNED,
                previousStatus,
                newStatus: "ASSIGNED",
                performedBy: user.sub,
                performedRole: JSON.stringify(user.groups || [])
            },client);

            await client.query("COMMIT");
            return updateRes.rows[0];

        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
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