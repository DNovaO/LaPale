package cortesias

type CreateReglaRequest struct {
	Nombre       string   `json:"nombre"`
	MontoMinimo  float64  `json:"monto_minimo"`
	MontoMaximo  *float64 `json:"monto_maximo"`
	ProductoID   string   `json:"producto_id"`
	Cantidad     int      `json:"cantidad"`
	LimiteDiario int      `json:"limite_diario"`
}

type UpdateReglaRequest struct {
	Nombre       string   `json:"nombre"`
	MontoMinimo  float64  `json:"monto_minimo"`
	MontoMaximo  *float64 `json:"monto_maximo"`
	ProductoID   string   `json:"producto_id"`
	Cantidad     int      `json:"cantidad"`
	LimiteDiario int      `json:"limite_diario"`
}

type ToggleReglaRequest struct {
	Activa bool `json:"activa"`
}

type FiltrosHistorial struct {
	SucursalID string
	FechaDesde string
	FechaHasta string
	VendedorID string
	Limite     int
}
