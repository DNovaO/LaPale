package bitacora

import "time"

type Registro struct {
	ID              string      `json:"id"`
	UsuarioID       string      `json:"usuario_id"`
	UsuarioNombre   string      `json:"usuario_nombre"`
	SucursalID      string      `json:"sucursal_id"`
	Modulo          string      `json:"modulo"`
	Accion          string      `json:"accion"`
	Entidad         string      `json:"entidad,omitempty"`
	EntidadID       string      `json:"entidad_id,omitempty"`
	DatosAnteriores interface{} `json:"datos_anteriores,omitempty"`
	DatosNuevos     interface{} `json:"datos_nuevos,omitempty"`
	IPAddress       string      `json:"ip_address,omitempty"`
	UserAgent       string      `json:"user_agent,omitempty"`
	CreatedAt       time.Time   `json:"created_at"`
}

// Módulos del sistema
const (
	ModuloAuth       = "AUTH"
	ModuloUsuarios   = "USUARIOS"
	ModuloInventario = "INVENTARIO"
	ModuloVentas     = "VENTAS"
	ModuloFinanzas   = "FINANZAS"
	ModuloCaja       = "CAJA"
)

// Acciones del sistema
const (
	// Auth
	AccionLogin  = "LOGIN"
	AccionLogout = "LOGOUT"

	// CRUD genérico
	AccionCrear      = "CREAR"
	AccionActualizar = "ACTUALIZAR"
	AccionEliminar   = "ELIMINAR"
	AccionConsultar  = "CONSULTAR"

	// Usuarios
	AccionActivar         = "ACTIVAR"
	AccionDesactivar      = "DESACTIVAR"
	AccionCambiarPassword = "CAMBIAR_PASSWORD"

	// Inventario
	AccionEntradaStock = "ENTRADA_STOCK"
	AccionSalidaStock  = "SALIDA_STOCK"
	AccionAjusteStock  = "AJUSTE_STOCK"

	// Ventas
	AccionConfirmarVenta    = "CONFIRMAR_VENTA"
	AccionCancelarVenta     = "CANCELAR_VENTA"
	AccionRegistrarCortesia = "REGISTRAR_CORTESIA"

	// Finanzas
	AccionRegistrarGasto = "REGISTRAR_GASTO"
	AccionEliminarGasto  = "ELIMINAR_GASTO"
	AccionCerrarCaja     = "CERRAR_CAJA"
)
