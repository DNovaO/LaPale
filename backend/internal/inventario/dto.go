package inventario

type CreateProductoRequest struct {
	Nombre         string  `json:"nombre"`
	SKU            string  `json:"sku"`
	Descripcion    string  `json:"descripcion"`
	Precio         float64 `json:"precio"`
	StockInicial   float64 `json:"stock_inicial"`
	StockMinimo    int     `json:"stock_minimo"`
	Tipo           string  `json:"tipo"`
	Medida         string  `json:"medida"`
	Presentaciones string  `json:"presentaciones"`
}

type UpdateProductoRequest struct {
	Nombre         string  `json:"nombre"`
	SKU            string  `json:"sku"`
	Descripcion    string  `json:"descripcion"`
	Precio         float64 `json:"precio"`
	StockMinimo    int     `json:"stock_minimo"`
	Tipo           string  `json:"tipo"`
	Medida         string  `json:"medida"`
	Presentaciones string  `json:"presentaciones"`
}

type MovimientoRequest struct {
	ProductoID    string  `json:"producto_id"`
	Tipo          string  `json:"tipo"`
	Cantidad      float64 `json:"cantidad"`
	Observaciones string  `json:"observaciones"`
}

type FiltrosMovimiento struct {
	ProductoID string
	Tipo       string
	Limite     int
}
