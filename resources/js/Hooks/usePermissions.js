import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

export function usePermissions() {
  const { props } = usePage();
  // Memoize the permissions array for stability if props don't change frequently
  const permissionsArray = useMemo(() => props.userPermissions || [], [props.userPermissions]);

  // For potentially faster lookups if you have many permissions,
  // you could convert the array to a Set once.
  const permissionsSet = useMemo(() => new Set(permissionsArray), [permissionsArray]);
  const can = (permissionName) => {
 
    if (!permissionName) return false;

    // Check against the Set for O(1) average time complexity
    return permissionsSet.has(permissionName);
    // Or, if you prefer to stick with the array (O(n) time complexity):
    // return permissionsArray.includes(permissionName);
  };

  return { can, permissions: permissionsArray }; // Expose the raw array if needed elsewhere
}