export const getAvatarPlaceholder = (name) => {
    const colors = [
        'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 
        'bg-purple-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-orange-500'
    ];
    if (!name || name.trim() === '') name = "?"; 
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];
    
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return {
        colorClass: color,
        initials: initials || name.charAt(0).toUpperCase()
    };
};
