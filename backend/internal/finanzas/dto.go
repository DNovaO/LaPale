package finanzas

type CreateGastoRequest struct {
	Tipo          string  `json:"tipo"`
	Monto         float64 `json:"monto"`
	Descripcion   string  `json:"descripcion"`
	Observaciones string  `json:"observaciones"`
	Fecha         string  `json:"fecha"` // YYYY-MM-DD
}

type CerrarCajaRequest struct {
	Notas string `json:"notas"`
}

type FiltrosPeriodo struct {
	SucursalID string
	Desde      string // YYYY-MM-DD
	Hasta      string // YYYY-MM-DD
}
