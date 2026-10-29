// UI-only helper. The server (policies) is always the authority.
export const can = (me, permission) => !!me?.permissions?.includes(permission);
