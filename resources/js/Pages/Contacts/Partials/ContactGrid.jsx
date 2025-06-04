import React from 'react';
import ContactGridCard from './ContactGridCard';

export default function ContactGrid({ displayedContacts, getAvatarPlaceholder, handleDelete, isListMounted }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
            {displayedContacts.map((contact, index) => {
                const avatar = getAvatarPlaceholder(contact.name);
                return (
                    <div
                        key={`grid-${contact.id}`}
                        className={isListMounted ? 'animate-fadeInUp' : 'opacity-0'}
                        style={{ animationDelay: isListMounted ? `${index * 0.05}s` : '0s' }}
                    >
                        <ContactGridCard contact={contact} avatar={avatar} handleDelete={handleDelete} />
                    </div>
                );
            })}
        </div>
    );
}
