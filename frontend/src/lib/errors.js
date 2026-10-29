// Laravel 422 -> { field: 'first message' }; anything else -> a general message.
export const parseApiError = (err) => {
    const status = err.response?.status;
    if (status === 422) {
        const fields = Object.fromEntries(
            Object.entries(err.response.data.errors ?? {}).map(([k, v]) => [k, v[0]]),
        );
        return { fields, message: err.response.data.message };
    }
    if (status === 403) return { fields: {}, message: 'You do not have permission to do that.' };
    if (status === 404) return { fields: {}, message: 'Not found.' };
    return { fields: {}, message: 'Something went wrong. Please try again.' };
};
