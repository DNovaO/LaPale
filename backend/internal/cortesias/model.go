package cortesias

import "time"

type ReglaCortesia struct {
	ID             string    `json:"id"`
	SucursalID     string    `json:"sucursal_id"`
	Nombre         string    `json:"nombre"`
	MontoMinimo    float64   `json:"monto_minimo"`
	MontoMaximo    *float64  `json:"monto_maximo"`
	ProductoID     string    `json:"producto_id"`
	ProductoNombre string    `json:"producto_nombre,omitempty"`
	Cantidad       int       `json:"cantidad"`
	Activa         bool      `json:"activa"`
	LimiteDiario   int       `json:"limite_diario"`
	ContadorDiario int        `json:"contador_diario"`
	FechaContador  *time.Time `json:"fecha_contador,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type CortesiaOtorgada struct {
	ID             string    `json:"id"`
	VentaID        string    `json:"venta_id"`
	TicketNumero   int       `json:"ticket_numero,omitempty"`
	ReglaID        string    `json:"regla_id"`
	ReglaNombre    string    `json:"regla_nombre,omitempty"`
	ProductoID     string    `json:"producto_id"`
	ProductoNombre string    `json:"producto_nombre,omitempty"`
	Cantidad       int       `json:"cantidad"`
	MontoCompra    float64   `json:"monto_compra"`
	VendedorID     string    `json:"vendedor_id"`
	VendedorNombre string    `json:"vendedor_nombre,omitempty"`
	SucursalID     string    `json:"sucursal_id"`
	CreatedAt      time.Time `json:"created_at"`
}

type DashboardCortesia struct {
	TotalesHoy     int                 `json:"totales_hoy"`
	PorRegla       []ResumenPorRegla   `json:"por_regla"`
	PorVendedor    []ResumenPorVendedor `json:"por_vendedor"`
	Disponibles    []DisponibleRegla    `json:"disponibles"`
}

type ResumenPorRegla struct {
	ReglaID     string `json:"regla_id"`
	ReglaNombre string `json:"regla_nombre"`
	Producto    string `json:"producto"`
	Entregadas  int    `json:"entregadas"`
	LimiteDiario int   `json:"limite_diario"`
}

type ResumenPorVendedor struct {
	VendedorID     string `json:"vendedor_id"`
	VendedorNombre string `json:"vendedor_nombre"`
	Entregadas     int    `json:"entregadas"`
}

type DisponibleRegla struct {
	ReglaID     string `json:"regla_id"`
	ReglaNombre string `json:"regla_nombre"`
	Producto    string `json:"producto"`
	LimiteDiario int   `json:"limite_diario"`
	EntregadasHoy int  `json:"entregadas_hoy"`
	Restantes    int    `json:"restantes"`
}

type CortesiaInfo struct {
	ProductoID     string `json:"producto_id"`
	ProductoNombre string `json:"producto_nombre"`
	Cantidad       int    `json:"cantidad"`
	ReglaID        string `json:"regla_id"`
	ReglaNombre    string `json:"regla_nombre"`
}
