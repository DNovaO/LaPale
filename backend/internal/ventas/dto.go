package ventas

type CrearVentaRequest struct {
	Detalle []DetalleRequest `json:"detalle"`
	Pago    PagoRequest      `json:"pago"`
}

type DetalleRequest struct {
	ProductoID string  `json:"producto_id"`
	Cantidad   float64 `json:"cantidad"`
	EsCortesia bool    `json:"es_cortesia"`
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
