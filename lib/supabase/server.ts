import { Pool } from "pg";
import { cookies } from "next/headers";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export function getPool() {
  return pool;
}

function parseFields(str: string): { fields: string[], relations: any[] } {
  const fields: string[] = [];
  const relations: any[] = [];
  
  let current = "";
  let depth = 0;
  let parenStart = -1;
  let relationName = "";

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') {
      if (depth === 0) {
        parenStart = i;
        relationName = current.trim();
        current = "";
      }
      depth++;
    } else if (char === ')') {
      depth--;
      if (depth === 0) {
        const inner = str.substring(parenStart + 1, i);
        relations.push({ name: relationName, inner });
        current = "";
      }
    } else if (char === ',' && depth === 0) {
      if (current.trim()) {
        fields.push(current.trim());
      }
      current = "";
    } else {
      if (depth === 0) {
        current += char;
      }
    }
  }
  if (current.trim()) {
    fields.push(current.trim());
  }
  
  return { fields, relations };
}

function reconstructRows(rows: any[]) {
  return rows.map(row => {
    const newRow: any = {};
    const relationsData: Record<string, any> = {};

    for (const key of Object.keys(row)) {
      if (key.startsWith("_rel_")) {
        const rest = key.substring(5); // e.g. "created_by" or "vehicle__registration_number"
        const doubleUnderscoreIdx = rest.indexOf("__");
        
        if (doubleUnderscoreIdx === -1) {
          relationsData[rest] = row[key];
        } else {
          const alias = rest.substring(0, doubleUnderscoreIdx);
          const field = rest.substring(doubleUnderscoreIdx + 2);
          if (!relationsData[alias]) {
            relationsData[alias] = {};
          }
          relationsData[alias][field] = row[key];
        }
      } else {
        newRow[key] = row[key];
      }
    }

    for (const alias of Object.keys(relationsData)) {
      const obj = relationsData[alias];
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        const allNull = Object.values(obj).every(v => v === null);
        newRow[alias] = allNull ? null : obj;
      } else {
        newRow[alias] = obj;
      }
    }

    return newRow;
  });
}

class PostgresQueryBuilder {
  private table: string;
  private selectCols: string = "*";
  private whereClauses: { col: string; val: any; operator: string }[] = [];
  private orderCol: string | null = null;
  private orderAsc: boolean = true;
  private limitVal: number | null = null;
  private insertData: any = null;
  private updateData: any = null;
  private isSingle = false;
  private isMaybeSingle = false;
  private options: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(cols: string = "*", options?: any) {
    this.selectCols = cols;
    this.options = options;
    return this;
  }

  insert(data: any) {
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.updateData = data;
    return this;
  }

  eq(col: string, val: any) {
    this.whereClauses.push({ col, val, operator: "=" });
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = options?.ascending ?? true;
    return this;
  }

  limit(val: number) {
    this.limitVal = val;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const res = await this.execute();
      if (onfulfilled) return onfulfilled(res);
      return res;
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }

  async execute() {
    try {
      if (this.options?.count) {
        let sql = `SELECT count(*) as count FROM public.${this.table}`;
        const params: any[] = [];
        if (this.whereClauses.length > 0) {
          const clauses = this.whereClauses.map((w, idx) => {
            params.push(w.val);
            return `${w.col} ${w.operator} $${idx + 1}`;
          });
          sql += ` WHERE ` + clauses.join(" AND ");
        }
        const dbRes = await pool.query(sql, params);
        return { count: parseInt(dbRes.rows[0].count), data: null, error: null };
      }

      if (this.insertData) {
        const isArray = Array.isArray(this.insertData);
        const records = isArray ? this.insertData : [this.insertData];
        if (records.length === 0) return { data: isArray ? [] : null, error: null };

        const allKeys = Object.keys(records[0]);
        const valuesList: string[] = [];
        const params: any[] = [];
        let pIdx = 1;

        for (const record of records) {
          const placeholders = allKeys.map(k => {
            params.push(record[k]);
            return `$${pIdx++}`;
          });
          valuesList.push(`(${placeholders.join(", ")})`);
        }

        const sql = `INSERT INTO public.${this.table} (${allKeys.join(", ")}) VALUES ${valuesList.join(", ")} RETURNING *`;
        const dbRes = await pool.query(sql, params);
        const returnedData = isArray ? dbRes.rows : dbRes.rows[0];
        return { data: returnedData, error: null };
      }

      if (this.updateData) {
        const keys = Object.keys(this.updateData);
        const params: any[] = [];
        let pIdx = 1;

        const setClause = keys.map(k => {
          params.push(this.updateData[k]);
          return `${k} = $${pIdx++}`;
        }).join(", ");

        let sql = `UPDATE public.${this.table} SET ${setClause}`;

        if (this.whereClauses.length > 0) {
          const clauses = this.whereClauses.map(w => {
            params.push(w.val);
            return `${w.col} ${w.operator} $${pIdx++}`;
          });
          sql += ` WHERE ` + clauses.join(" AND ");
        }

        sql += ` RETURNING *`;
        const dbRes = await pool.query(sql, params);
        const returnedData = this.isSingle || this.isMaybeSingle ? dbRes.rows[0] : dbRes.rows;
        return { data: returnedData, error: null };
      }

      const { fields, relations } = parseFields(this.selectCols);
      const selectColsList: string[] = [];

      for (const f of fields) {
        if (f === "*") {
          selectColsList.push(`${this.table}.*`);
        } else {
          selectColsList.push(`${this.table}.${f}`);
        }
      }

      const joins: string[] = [];
      for (const rel of relations) {
        let relName = rel.name;
        let alias = relName;
        let targetTable = relName;
        if (relName.includes(":")) {
          const parts = relName.split(":");
          alias = parts[0].trim();
          targetTable = parts[1].trim();
        }

        let onClause = "";
        if (targetTable === "vehicles") {
          onClause = `${this.table}.vehicle_id = ${alias}.id`;
        } else if (targetTable === "drivers") {
          onClause = `${this.table}.driver_id = ${alias}.id`;
        } else if (targetTable === "trips") {
          onClause = `${this.table}.trip_id = ${alias}.id`;
        } else if (targetTable === "profiles") {
          onClause = `${this.table}.created_by = ${alias}.id`;
        }

        joins.push(`LEFT JOIN public.${targetTable} AS ${alias} ON ${onClause}`);

        const innerResult = parseFields(rel.inner);
        for (const inf of innerResult.fields) {
          if (inf === "*") {
            selectColsList.push(`row_to_json(${alias}) AS _rel_${alias}`);
          } else {
            selectColsList.push(`${alias}.${inf} AS _rel_${alias}__${inf}`);
          }
        }
      }

      let sql = `SELECT ${selectColsList.join(", ")} FROM public.${this.table} AS ${this.table}`;
      if (joins.length > 0) {
        sql += ` ` + joins.join(" ");
      }

      const params: any[] = [];
      if (this.whereClauses.length > 0) {
        const clauses = this.whereClauses.map((w, idx) => {
          params.push(w.val);
          return `${this.table}.${w.col} ${w.operator} $${idx + 1}`;
        });
        sql += ` WHERE ` + clauses.join(" AND ");
      }

      if (this.orderCol) {
        sql += ` ORDER BY ${this.table}.${this.orderCol} ${this.orderAsc ? "ASC" : "DESC"}`;
      }

      if (this.limitVal !== null) {
        sql += ` LIMIT ${this.limitVal}`;
      }

      const dbRes = await pool.query(sql, params);
      let formattedRows = reconstructRows(dbRes.rows);

      if (this.isSingle) {
        return { data: formattedRows[0] || null, error: formattedRows[0] ? null : { message: "Row not found", code: "PGRST116" } };
      }
      if (this.isMaybeSingle) {
        return { data: formattedRows[0] || null, error: null };
      }

      return { data: formattedRows, error: null };

    } catch (err: any) {
      console.error(`Postgres error in table ${this.table}:`, err);
      return { data: null, error: { message: err.message || String(err), code: err.code } };
    }
  }
}

const authMock = {
  async getUser() {
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("transitops_session");
      if (!sessionCookie || !sessionCookie.value) {
        return { data: { user: null }, error: null };
      }
      
      const payload = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf8"));
      return {
        data: {
          user: {
            id: payload.userId,
            email: payload.email,
            user_metadata: {
              role: payload.userRole,
              full_name: payload.fullName
            }
          }
        },
        error: null
      };
    } catch (e: any) {
      console.error("getUser error:", e);
      return { data: { user: null }, error: e };
    }
  }
};

export async function createClient() {
  return {
    auth: authMock,
    from(table: string) {
      return new PostgresQueryBuilder(table);
    }
  } as any;
}
