GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO public;