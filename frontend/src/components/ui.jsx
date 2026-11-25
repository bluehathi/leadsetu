export const Button = ({ variant = 'primary', className = '', ...props }) => (
    <button {...props}
        className={`rounded px-3 py-2 text-sm disabled:opacity-50 ${
            variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700'
                : variant === 'danger' ? 'text-red-600 hover:underline'
                : 'border hover:bg-gray-100'} ${className}`} />
);

// `group` renders a div (not a label) for fields that contain their own labels, e.g. checkbox lists.
export const Field = ({ label, error, children, group = false }) => {
    const Wrapper = group ? 'div' : 'label';
    return (
    <Wrapper className="block text-sm">
        <span className="mb-1 block font-medium">{label}</span>
        {children}
        {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </Wrapper>
    );
};

export const inputClass = 'w-full rounded border p-2 text-sm';

export function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="w-full max-w-md rounded bg-white p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="mb-4 text-lg font-semibold">{title}</h2>
                {children}
            </div>
        </div>
    );
}

export function Pagination({ meta, onPage }) {
    if (!meta || meta.last_page <= 1) return null;
    return (
        <div className="mt-4 flex items-center justify-between text-sm">
            <span>Page {meta.current_page} of {meta.last_page} ({meta.total} total)</span>
            <span className="space-x-2">
                <Button variant="secondary" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>Previous</Button>
                <Button variant="secondary" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}>Next</Button>
            </span>
        </div>
    );
}
