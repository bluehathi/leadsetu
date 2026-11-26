export const Button = ({ variant = 'primary', className = '', ...props }) => (
    <button {...props}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            variant === 'primary' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm hover:from-indigo-700 hover:to-violet-700'
                : variant === 'danger' ? 'text-red-600 hover:bg-red-50'
                : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50'} ${className}`} />
);

// `group` renders a div (not a label) for fields that contain their own labels, e.g. checkbox lists.
export const Field = ({ label, error, children, group = false }) => {
    const Wrapper = group ? 'div' : 'label';
    return (
    <Wrapper className="block text-sm">
        <span className="mb-1 block font-medium text-gray-700">{label}</span>
        {children}
        {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </Wrapper>
    );
};

export const inputClass = 'w-full rounded-lg border border-gray-300 p-2 text-sm shadow-sm placeholder:text-gray-400';

// Standard white surface used for panels and stat tiles.
export const cardClass = 'rounded-xl border border-gray-200 bg-white shadow-sm';

export function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="mb-4 text-lg font-semibold">{title}</h2>
                {children}
            </div>
        </div>
    );
}

export function Pagination({ meta, onPage }) {
    if (!meta || meta.last_page <= 1) return null;
    return (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>Page {meta.current_page} of {meta.last_page} ({meta.total} total)</span>
            <span className="space-x-2">
                <Button variant="secondary" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>Previous</Button>
                <Button variant="secondary" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}>Next</Button>
            </span>
        </div>
    );
}
