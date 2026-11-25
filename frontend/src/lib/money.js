// All amounts travel as integer minor units (paise/cents). Never parse money with floats.
export const toMinor = (text) => {
    const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(text ?? '').trim());
    return m ? parseInt(m[1], 10) * 100 + parseInt((m[2] ?? '').padEnd(2, '0') || '0', 10) : null;
};
export const fromMinor = (minor) => (Math.round(minor) / 100).toFixed(2);
export const formatMoney = (minor, currency = 'INR') =>
    new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency }).format((minor ?? 0) / 100);
