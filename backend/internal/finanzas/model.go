package finanzas

import "time"

type Gasto struct {
	ID            string    `json:"id"`
	SucursalID    string    `json:"sucursal_id"`
	UsuarioID     string    `json:"usuario_id"`
	UsuarioNombre string    `json:"usuario_nombre"`
	Tipo          string    `json:"tipo"`
	Monto         float64   `json:"monto"`
	Descripcion   string    `json:"descripcion,omitempty"`
	Observaciones string    `json:"observaciones,omitempty"`
	Fecha         string    `json:"fecha"`
	CreatedAt     time.Time `json:"created_at"`
}

type CierreCaja struct {
	ID                 string    `json:"id"`
	SucursalID         string    `json:"sucursal_id"`
	UsuarioID          string    `json:"usuario_id"`
	UsuarioNombre      string    `json:"usuario_nombre"`
	TotalEfectivo      float64   `json:"total_efectivo"`
	TotalTarjeta       float64   `json:"total_tarjeta"`
	TotalTransferencia float64   `json:"total_transferencia"`
	TotalCortesias     float64   `json:"total_cortesias"`
	NumCortesias       int       `json:"num_cortesias"`
	TotalGastos        float64   `json:"total_gastos"`
	TotalVentas        float64   `json:"total_ventas"`
	NumVentas          int       `json:"num_ventas"`
	ReporteEnviado     bool      `json:"reporte_enviado"`
	FechaCierre        time.Time `json:"fecha_cierre"`
	Notas              string    `json:"notas,omitempty"`
}

type ResumenDia struct {
	Fecha                string            `json:"fecha"`
	TotalVentas          float64           `json:"total_ventas"`
	NumVentas            int               `json:"num_ventas"`
	TotalEfectivo        float64           `json:"total_efectivo"`
	TotalTarjeta         float64           `json:"total_tarjeta"`
	TotalTransferencia   float64           `json:"total_transferencia"`
	TotalCortesias       float64           `json:"total_cortesias"`
	NumCortesias         int               `json:"num_cortesias"`
	TotalGastos          float64           `json:"total_gastos"`
	Utilidad             float64           `json:"utilidad"`
	ProductosMasVendidos []ProductoVendido `json:"productos_mas_vendidos"`
}

type ProductoVendido struct {
	ProductoID string  `json:"producto_id"`
	Nombre     string  `json:"nombre"`
	Cantidad   int     `json:"cantidad"`
	Total      float64 `json:"total"`
}

type ResumenPeriodo struct {
	Desde          string  `json:"desde"`
	Hasta          string  `json:"hasta"`
	TotalVentas    float64 `json:"total_ventas"`
	NumVentas      int     `json:"num_ventas"`
	TotalGastos    float64 `json:"total_gastos"`
	TotalCortesias float64 `json:"total_cortesias"`
	Utilidad       float64 `json:"utilidad"`
}

// Tipos de gasto válidos
const (
	TipoRenta         = "RENTA"
	TipoServicios     = "SERVICIOS"
	TipoInsumos       = "INSUMOS"
	TipoNomina        = "NOMINA"
	TipoMantenimiento = "MANTENIMIENTO"
	TipoOtro          = "OTRO"
)
