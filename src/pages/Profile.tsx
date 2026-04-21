import { Navigate } from 'react-router-dom';

/**
 * The standalone /profile page is superseded by the Settings sheet on mobile
 * and the Profile tab inside /settings on desktop. Both surfaces merge the
 * old Profile content into Account + Profile sections for a single source of
 * truth. This redirect keeps any saved links working.
 */
export default function Profile() {
  return <Navigate to="/settings?section=profile" replace />;
}
