/**
 * Formatea una fecha a un formato legible por humanos.
 * @param {string|Date} date - Fecha a formatear.
 * @param {string} locale - Localización (defecto es-MX).
 * @returns {string} - Fecha formateada.
 */
export const fmtDate = (date, locale = 'es-MX') => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

/**
 * Formatea un número como moneda.
 * @param {number} amount - Cantidad a formatear.
 * @param {string} currency - Moneda (defecto MXN).
 * @returns {string} - Cantidad formateada.
 */
export const fmtCurrency = (amount, currency = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency
    }).format(amount ?? 0);
};

/**
 * Obtiene las iniciales de un nombre.
 * @param {string} name - Nombre completo.
 * @returns {string} - Iniciales.
 */
export const initials = (name = '') => {
    if (!name) return '??';
    return name
        .split(' ')
        .map(n => n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

/**
 * Calcula los días transcurridos desde una fecha hasta hoy.
 * @param {string|Date} date - Fecha inicial.
 * @returns {number|null} - Días transcurridos.
 */
export const daysSince = (date) => {
    if (!date) return null;
    return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
};
