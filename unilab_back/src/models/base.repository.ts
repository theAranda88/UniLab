/** Filtro estándar para excluir registros con soft-delete. */
export const activo = { deleted_at: null } as const;
