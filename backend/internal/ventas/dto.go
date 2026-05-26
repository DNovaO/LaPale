package ventas

type CrearVentaRequest struct {
	Tipo          string           `json:"tipo"` // NORMAL | CORTESIA
	AutorizadoPor string           `json:"autorizado_por"`
	Notas         string           `json:"notas"`
	Detalle       []DetalleRequest `json:"detalle"`
	Pago          PagoRequest      `json:"pago"`
}

type DetalleRequest struct {
	ProductoID string `json:"producto_id"`
	Cantidad   int    `json:"cantidad"`
}

type PagoRequest struct {
	Metodo        string  `json:"metodo"`         // EFECTIVO | TARJETA | TRANSFERENCIA
	MontoRecibido float64 `json:"monto_recibido"` // solo para efectivo
}

type CancelarVentaRequest struct {
	Motivo string `json:"motivo"`
}

type FiltrosVenta struct {
	SucursalID string
	VendedorID string
	Estado     string
	Tipo       string
	Fecha      string // YYYY-MM-DD
	Limite     int
}
