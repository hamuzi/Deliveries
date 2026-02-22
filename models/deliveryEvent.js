const pool = require("../db/pool")


class DeliveryEvent{
    static TYPES = {
        CREATED: "CREATED",
        STATUS_CHANGE: "STATUS_CHANGE",
        ASSIGNED: "ASSIGNED",
    };

    static async create({
        deliveryId,
        eventType,
        previousStatus = null,
        newStatus = null,
        performedBy,
        performedRole
    },client = null){
        const db = client || pool; // for insert and update in the same action for 1 user only (race condition treatment.)
        const result = await db.query(
            `INSERT INTO delivery_events
            (delivery_id, event_type, previous_status, new_status, performed_by, performed_role)
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *
            `,[deliveryId,
            eventType,
            previousStatus,
            newStatus,
            performedBy,
            performedRole]);
        return result.rows[0];            
    }

    static async listByDeliveryId(deliveryId, { limit = 20, cursor = null } = {}) {
        const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
        let cursorCreatedAt = null;
        let cursorId = null;

        if (cursor) {
            const [ts, idStr] = String(cursor).split("|");
            if (ts && idStr) {
            cursorCreatedAt = ts;
            cursorId = Number(idStr);
            if (Number.isNaN(cursorId)) cursorId = null;
            }
        }

        const values = [deliveryId];
        const parts = [`
            SELECT id, delivery_id, event_type, previous_status, new_status,
                performed_by, performed_role, created_at
            FROM delivery_events
            WHERE delivery_id = $1
            `.trim()
        ];

        if (cursorCreatedAt && cursorId) {
            parts.push(`AND (created_at, id) < ($2::timestamptz, $3::bigint)`);
            values.push(cursorCreatedAt, cursorId);
        }

        parts.push(`ORDER BY created_at DESC, id DESC`);
        parts.push(`LIMIT $${values.length + 1}`);
        values.push(safeLimit);
        const query = parts.join("\n");

        const result = await pool.query(query, values);
        const rows = result.rows.map((r) => {
            let roleArr = [];
            try { roleArr = JSON.parse(r.performed_role || "[]"); } catch (_) {}
            return { ...r, performed_role: roleArr };
        });

        const last = rows[rows.length - 1];
        const nextCursor = last ? `${new Date(last.created_at).toISOString()}|${last.id}` : null;

        return { events: rows, nextCursor };
            }
   
}

module.exports = DeliveryEvent;