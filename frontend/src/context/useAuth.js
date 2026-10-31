// Keep the shared hook from the main frontend scaffold pointed at the same
// provider instance used by the API-integrated routes.
export { useAuth, useAuth as default } from './AuthContext.jsx';
