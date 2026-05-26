package inventario

type CreateProductoRequest struct {
	Nombre       string  `json:"nombre"`
	SKU          string  `json:"sku"`
	Descripcion  string  `json:"descripcion"`
	Precio       float64 `json:"precio"`
	StockInicial int     `json:"stock_inicial"`
	StockMinimo  int     `json:"stock_minimo"`
}

type UpdateProductoRequest struct {
	Nombre      string  `json:"nombre"`
	SKU         string  `json:"sku"`
	Descripcion string  `json:"descripcion"`
	Precio      float64 `json:"precio"`
	StockMinimo int     `json:"stock_minimo"`
}

type MovimientoRequest struct {
	ProductoID    string `json:"producto_id"`
	Tipo          string `json:"tipo"`
	Cantidad      int    `json:"cantidad"`
	Observaciones string `json:"observaciones"`
}

type FiltrosMovimiento struct {
	ProductoID string
	Tipo       string
	Limite     int
}
