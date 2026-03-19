import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let pool;

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  pool.on('error', (err) => {
    console.error('Unexpected DB pool error:', err.message);
  });
} catch (err) {
  console.error('Failed to create DB pool:', err.message);
}

/**
 * Convierte los keys de un objeto de snake_case a camelCase.
 * Ejemplo: member_name -> memberName
 */
export const toCamel = (rows) => {
  return rows.map((row) => {
    const camelRow = {};
    for (const key in row) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camelRow[camelKey] = row[key];
    }
    return camelRow;
  });
};

/**
 * Ejecuta una query y retorna las filas en camelCase.
 * Wrapper principal para usar en lugar de pool.query directo.
 */
export const query = async (text, params) => {
  const res = await pool.query(text, params);
  return {
    ...res,
    rows: toCamel(res.rows)
  };
};

/**
 * Retorna el pool de conexiones directamente.
 * Útil para transacciones que requieren client.connect().
 */
export const getPool = () => pool;

export default { query, getPool, toCamel };
