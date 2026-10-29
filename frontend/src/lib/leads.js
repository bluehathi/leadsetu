export const STATUSES = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'unqualified', label: 'Unqualified' },
    { value: 'lost', label: 'Lost' },
    { value: 'won', label: 'Won' },
];
export const SOURCES = [
    { value: 'website', label: 'Website form' },
    { value: 'referral', label: 'Referral' },
    { value: 'cold_call', label: 'Cold call' },
    { value: 'advertisement', label: 'Advertisement' },
    { value: 'other', label: 'Other' },
];
export const PRIORITIES = ['High', 'Medium', 'Low'].map((v) => ({ value: v, label: v }));

export const label = (options, value) => options.find((o) => o.value === value)?.label ?? value;
