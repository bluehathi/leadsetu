import React from 'react';
import { useForm } from '@inertiajs/react'; // Assuming you'll use Inertia for form submission later
import { X, Send } from 'lucide-react';

export default function ComposeEmailModal({
    isOpen,
    onClose,
    contact, // The contact object { id, name, email }
    workspaceFromAddress, // Default from address for the workspace
    workspaceFromName,    // Default from name for the workspace
    processingRequest // Optional: boolean to show loading state on send button
}) {
    // Initialize useForm - we'll connect this to a backend route later
    const { data, setData, post, processing, errors, reset } = useForm({
        subject: '',
        body: '',
        // We'll also need to send contact_id, but that's part of the route/controller
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // This is where you'll eventually POST to your Laravel backend
        // For now, let's just log it and close the modal
        console.log('Form data to send:', {
            contact_id: contact.id,
            ...data
        });
        // Example: post(route('contacts.sendComposedEmail', { contact: contact.id }), {
        //     preserveScroll: true,
        //     onSuccess: () => {
        //         onClose(); 
        //         reset();   
        //         // Add a success flash message here
        //     },
        //     onError: (formErrors) => {
        //         console.error("Error sending email:", formErrors);
        //         // Handle errors, maybe show them in the modal
        //     }
        // });
        
        // For UI testing:
        alert(`Email to ${contact.name} would be sent with subject: ${data.subject}`);
        onClose();
        reset();
    };

    if (!isOpen || !contact) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out">
            <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeInScale">
                {/* Modal Header */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        Send Email to {contact.name}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-5 space-y-4 overflow-y-auto flex-grow pr-1"> {/* Added pr-1 for scrollbar */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To:</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 p-2.5 bg-gray-100 dark:bg-gray-700/60 rounded-md select-all">
                            {contact.email}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From:</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 p-2.5 bg-gray-100 dark:bg-gray-700/60 rounded-md">
                            {workspaceFromName} &lt;{workspaceFromAddress}&gt;
                        </p>
                    </div>
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                        <input
                            type="text"
                            name="subject"
                            id="subject"
                            value={data.subject}
                            onChange={e => setData('subject', e.target.value)}
                            className="mt-1 block w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md"
                            required
                        />
                        {errors.subject && <p className="text-xs text-red-500 mt-1.5">{errors.subject}</p>}
                    </div>
                    <div>
                        <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body</label>
                        <textarea
                            name="body"
                            id="body"
                            rows="10" // Adjust as needed
                            value={data.body}
                            onChange={e => setData('body', e.target.value)}
                            className="mt-1 block w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md resize-y"
                            required
                        ></textarea>
                        {errors.body && <p className="text-xs text-red-500 mt-1.5">{errors.body}</p>}
                    </div>
                </form>
                
                {/* Modal Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button" // Change to type="submit" when form is inside this button's scope or use form.submit()
                        onClick={handleSubmit} // This will trigger the form's onSubmit
                        disabled={processing || processingRequest}
                        className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} className="mr-2" />
                        {processing || processingRequest ? 'Sending...' : 'Send Email'}
                    </button>
                </div>
            </div>
            {/* Add this to your global CSS or a <style jsx global> tag if using Next.js for animation */}
            <style jsx global>{`
                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-modalFadeInScale {
                    animation: fadeInScale 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
