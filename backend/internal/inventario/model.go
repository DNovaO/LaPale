package inventario

import "time"

type Producto struct {
	ID             string    `json:"id"`
	SucursalID     string    `json:"sucursal_id"`
	Nombre         string    `json:"nombre"`
	SKU            string    `json:"sku"`
	Descripcion    string    `json:"descripcion"`
	Precio         float64   `json:"precio"`
	StockActual    float64   `json:"stock_actual"`
	StockMinimo    int       `json:"stock_minimo"`
	Activo         bool      `json:"activo"`
	Tipo           string    `json:"tipo"`
	Medida         string    `json:"medida"`
	Presentaciones string    `json:"presentaciones,omitempty"`
	Imagen         string    `json:"imagen,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Movimiento struct {
	ID             string    `json:"id"`
	ProductoID     string    `json:"producto_id"`
	ProductoNombre string    `json:"producto_nombre"`
	UsuarioID      string    `json:"usuario_id"`
	UsuarioNombre  string    `json:"usuario_nombre"`
	Tipo           string    `json:"tipo"`
	Cantidad       float64   `json:"cantidad"`
	StockAntes     int       `json:"stock_antes"`
	StockDespues   int       `json:"stock_despues"`
	ReferenciaID   string    `json:"referencia_id,omitempty"`
	Observaciones  string    `json:"observaciones,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

// Tipos de movimiento válidos
const (
	TipoEntrada        = "ENTRADA"
	TipoSalidaVenta    = "SALIDA_VENTA"
	TipoSalidaCortesia = "SALIDA_CORTESIA"
	TipoAjusteManual   = "AJUSTE_MANUAL"
	TipoMerma          = "MERMA"
)
