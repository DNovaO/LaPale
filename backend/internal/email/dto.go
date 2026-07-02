package email

type SendTicketRequest struct {
	Email        string          `json:"email"`
	TicketNumero int             `json:"ticket_numero"`
	Total        float64         `json:"total"`
	Metodo       string          `json:"metodo"`
	Items        []TicketItemReq `json:"items"`
}

type TicketItemReq struct {
	Nombre   string  `json:"nombre"`
	Cantidad int     `json:"cantidad"`
	Precio   float64 `json:"precio"`
}
