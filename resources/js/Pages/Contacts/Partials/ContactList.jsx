import React from 'react';
import ContactListCard from './ContactListCard';

export default function ContactList({ displayedContacts, getAvatarPlaceholder, handleDelete, isListMounted }) {
    return (
        <div className="space-y-4">
            {displayedContacts.map((contact, index) => {
                const avatar = getAvatarPlaceholder(contact.name);
                return (
                    <div
                        key={`list-${contact.id}`}
                        className={isListMounted ? 'animate-fadeInUp' : 'opacity-0'}
                        style={{ animationDelay: isListMounted ? `${index * 0.05}s` : '0s' }}
                    >
                        <ContactListCard contact={contact} avatar={avatar} handleDelete={handleDelete} />
                    </div>
                );
            })}
        </div>
    );
}
