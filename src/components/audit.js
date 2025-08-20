export async function logAuditEvent(supabase, { userId, action, details = {} }) {
  if (!supabase) return;
  const entry = {
    user_id: userId,
    action,
    details: { ...details, timestamp: new Date().toISOString() },
    created_at: new Date().toISOString()
  };
  try {
    await supabase.from('audit_log').insert(entry);
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
