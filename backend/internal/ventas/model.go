package ventas

import "time"

type Venta struct {
	ID             string         `json:"id"`
	SucursalID     string         `json:"sucursal_id"`
	VendedorID     string         `json:"vendedor_id"`
	VendedorNombre string         `json:"vendedor_nombre"`
	AutorizadoPor  string         `json:"autorizado_por,omitempty"`
	Tipo           string         `json:"tipo"`
	Estado         string         `json:"estado"`
	Subtotal       float64        `json:"subtotal"`
	Total          float64        `json:"total"`
	Notas          string         `json:"notas,omitempty"`
	TicketNumero   int            `json:"ticket_numero"`
	Detalle        []DetalleVenta `json:"detalle,omitempty"`
	Pagos          []Pago         `json:"pagos,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}

type DetalleVenta struct {
	ID             string  `json:"id"`
	VentaID        string  `json:"venta_id"`
	ProductoID     string  `json:"producto_id"`
	ProductoNombre string  `json:"producto_nombre"`
	Cantidad       int     `json:"cantidad"`
	PrecioUnitario float64 `json:"precio_unitario"`
	Subtotal       float64 `json:"subtotal"`
	EsCortesia     bool    `json:"es_cortesia"`
}

type Pago struct {
	ID                string  `json:"id"`
	VentaID           string  `json:"venta_id"`
	Metodo            string  `json:"metodo"`
	Monto             float64 `json:"monto"`
	MontoRecibido     float64 `json:"monto_recibido,omitempty"`
	Cambio            float64 `json:"cambio,omitempty"`
	MpPaymentID       string  `json:"mp_payment_id,omitempty"`
	ReferenciaExterna string  `json:"referencia_externa,omitempty"`
	Estado            string  `json:"estado"`
}

// Constantes
const (
	TipoNormal   = "NORMAL"
	TipoCortesia = "CORTESIA"

	EstadoAbierta   = "ABIERTA"
	EstadoCerrada   = "CERRADA"
	EstadoCancelada = "CANCELADA"

	MetodoEfectivo      = "EFECTIVO"
	MetodoTarjeta       = "TARJETA"
	MetodoTransferencia = "TRANSFERENCIA"

	EstadoPagoPendiente  = "PENDIENTE"
	EstadoPagoConfirmado = "CONFIRMADO"
)
