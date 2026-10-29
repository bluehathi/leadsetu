import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/Components/Ui/Modal'; 

const AddContactsToProspectListModal = ({ isOpen, onClose, contactIds, userProspectLists, onListUpdated, initialSelectedListIds = [] }) => {
    const [selectedListIds, setSelectedListIds] = useState([]);
    const [newListName, setNewListName] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (userProspectLists.length === 0) {
                setIsCreatingNew(true);
                setSelectedListIds([]);
            } else {
                setIsCreatingNew(false);
                setSelectedListIds(initialSelectedListIds.map(String)); // Use all preselected IDs as string
            }
            setNewListName('');
        }
    }, [isOpen, userProspectLists, initialSelectedListIds]);

    const handleCheckboxChange = (listId) => {
        setSelectedListIds((prev) =>
            prev.includes(listId)
                ? prev.filter((id) => id !== listId)
                : [...prev, listId]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (contactIds.length === 0) {
            alert("No contacts selected.");
            return;
        }
        setProcessing(true);

        const payload = {
            contact_ids: contactIds,
        };

        let targetRoute;

        if (isCreatingNew) {
            if (!newListName.trim()) {
                alert("New list name cannot be empty.");
                setProcessing(false);
                return;
            }
            payload.name = newListName;
            targetRoute = route('prospect-lists.store-and-add-contacts');
        } else {
            if (!selectedListIds.length) {
                alert("Please select at least one list.");
                setProcessing(false);
                return;
            }
            payload.prospect_list_ids = selectedListIds.map(id => parseInt(id, 10)); // Ensure IDs are integers
            targetRoute = route('prospect-lists.add-contacts-multi'); // You need to handle this route in your backend
        }

        router.post(targetRoute, payload, {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
                onClose();
                if (onListUpdated) onListUpdated();
            },
            onError: (errors) => {
                setProcessing(false);
                console.error("Error adding contacts to prospect list:", errors);
                const errorMessages = Object.values(errors).flat().join(' ');
                alert(`Failed to add contacts to list. ${errorMessages || 'Please try again.'}`);
            },
        });
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Add Contacts to Prospect List
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    You are adding {contactIds.length} contact(s).
                </p>

                <div className="mt-4">
                    <div className="flex items-center space-x-4 mb-4">
                        <button
                            type="button"
                            onClick={() => setIsCreatingNew(false)}
                            disabled={userProspectLists.length === 0}
                            className={`px-3 py-1.5 text-sm rounded-md ${!isCreatingNew && userProspectLists.length > 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50'}`}
                        >
                            Select Existing List
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreatingNew(true)}
                            className={`px-3 py-1.5 text-sm rounded-md ${isCreatingNew ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                        >
                            Create New List
                        </button>
                    </div>

                    {isCreatingNew ? (
                        <div className="mt-4">
                            <label htmlFor="newListName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                New List Name
                            </label>
                            <input
                                id="newListName"
                                type="text"
                                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                required={isCreatingNew}
                                autoFocus={isCreatingNew}
                                placeholder="Enter new list name..."
                                maxLength={255}
                            />
                        </div>
                    ) : (
                        userProspectLists.length > 0 ? (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Prospect List(s)
                                </label>
                                <div className="space-y-2">
                                    {userProspectLists.map((list) => (
                                        <label key={list.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                value={list.id}
                                                checked={selectedListIds.includes(String(list.id))}
                                                onChange={() => handleCheckboxChange(String(list.id))}
                                                className="form-checkbox h-4 w-4 text-blue-600"
                                            />
                                            <span>{list.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                No existing prospect lists. Please create a new one.
                            </p>
                        )
                    )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500 rounded-md font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-widest shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-25 transition ease-in-out duration-150"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing || (isCreatingNew ? !newListName.trim() : (!selectedListIds.length && userProspectLists.length > 0))}
                        className="inline-flex items-center px-4 py-2 bg-gray-800 dark:bg-gray-200 border border-transparent rounded-md font-semibold text-xs text-white dark:text-gray-800 uppercase tracking-widest hover:bg-gray-700 dark:hover:bg-white focus:bg-gray-700 dark:focus:bg-white active:bg-gray-900 dark:active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                    >
                        {processing ? 'Adding...' : 'Add to List'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddContactsToProspectListModal;