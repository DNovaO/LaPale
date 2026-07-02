package email

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"os"
	"strings"
)

func SendTicket(req SendTicketRequest) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	email := os.Getenv("SMTP_EMAIL")
	password := os.Getenv("SMTP_PASSWORD")
	from := os.Getenv("SMTP_FROM")
	if from == "" {
		from = "La Pale"
	}

	auth := smtp.PlainAuth("", email, password, host)

	tlsConfig := &tls.Config{
		ServerName:         host,
		InsecureSkipVerify: false,
	}

	// Conectar por TCP plano primero (STARTTLS en puerto 587)
	addr := net.JoinHostPort(host, port)
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		return fmt.Errorf("error conectando a SMTP: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return fmt.Errorf("error creando cliente SMTP: %w", err)
	}
	defer client.Quit()

	if err := client.StartTLS(tlsConfig); err != nil {
		return fmt.Errorf("error iniciando STARTTLS: %w", err)
	}

	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("error autenticando: %w", err)
	}
	if err := client.Mail(email); err != nil {
		return fmt.Errorf("error MAIL FROM: %w", err)
	}
	if err := client.Rcpt(req.Email); err != nil {
		return fmt.Errorf("error RCPT TO: %w", err)
	}

	wc, err := client.Data()
	if err != nil {
		return fmt.Errorf("error DATA: %w", err)
	}
	defer wc.Close()

	body := buildHTML(req)
	msg := fmt.Sprintf("From: %s <%s>\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s",
		from, email, req.Email,
		fmt.Sprintf("La Pale - Ticket #%d - $%.2f", req.TicketNumero, req.Total),
		body,
	)

	_, err = wc.Write([]byte(msg))
	if err != nil {
		return fmt.Errorf("error escribiendo mensaje: %w", err)
	}

	return nil
}

func buildHTML(req SendTicketRequest) string {
	var itemsHTML strings.Builder
	for _, item := range req.Items {
		itemsHTML.WriteString(fmt.Sprintf(`
		<tr style="border-bottom:1px solid #eee">
			<td style="padding:10px 14px;font-size:13px;color:#333">%s</td>
			<td style="padding:10px 14px;font-size:13px;color:#666;text-align:center">%d</td>
			<td style="padding:10px 14px;font-size:13px;color:#666;text-align:right">$%.2f</td>
			<td style="padding:10px 14px;font-size:13px;color:#333;text-align:right;font-weight:600">$%.2f</td>
		</tr>`, item.Nombre, item.Cantidad, item.Precio, item.Precio*float64(item.Cantidad)))
	}

	metodoLabel := req.Metodo
	switch req.Metodo {
	case "EFECTIVO":
		metodoLabel = "Efectivo"
	case "TARJETA":
		metodoLabel = "Tarjeta"
	case "TRANSFERENCIA":
		metodoLabel = "Transferencia"
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
<table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">

	<!-- Header -->
	<tr>
		<td style="background:linear-gradient(135deg,#00753F 0%%,#B6CD38 100%%);padding:28px 30px;text-align:center">
			<table width="100%%" cellpadding="0" cellspacing="0">
				<tr>
					<td style="width:48px">
						<div style="width:44px;height:44px;background:rgba(255,255,255,.2);border-radius:10px;font-size:22px;color:#fff;font-weight:700;line-height:44px">P</div>
					</td>
					<td style="text-align:left;padding-left:12px">
						<p style="margin:0;font-size:20px;font-weight:700;color:#fff">La Pale</p>
					</td>
				</tr>
			</table>
		</td>
	</tr>

	<!-- Title -->
	<tr>
		<td style="padding:24px 30px 0;text-align:center">
			<p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:.15em;color:#999;font-weight:600">Ticket de compra</p>
			<p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#00753F">#%d</p>
		</td>
	</tr>

	<!-- Info -->
	<tr>
		<td style="padding:16px 30px 0">
			<table width="100%%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;padding:14px 18px">
				<tr>
					<td style="font-size:12px;color:#888;padding-bottom:4px">Metodo de pago</td>
				</tr>
				<tr>
					<td style="font-size:13px;color:#333;font-weight:600">%s</td>
				</tr>
			</table>
		</td>
	</tr>

	<!-- Items -->
	<tr>
		<td style="padding:20px 30px 0">
			<table width="100%%" cellpadding="0" cellspacing="0" style="font-size:12px">
				<tr style="border-bottom:2px solid #00753F">
					<th style="padding:8px 14px;text-align:left;color:#00753F;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Producto</th>
					<th style="padding:8px 14px;text-align:center;color:#00753F;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Cant</th>
					<th style="padding:8px 14px;text-align:right;color:#00753F;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Precio</th>
					<th style="padding:8px 14px;text-align:right;color:#00753F;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Subtotal</th>
				</tr>
				%s
			</table>
		</td>
	</tr>

	<!-- Total -->
	<tr>
		<td style="padding:20px 30px">
			<table width="100%%" cellpadding="0" cellspacing="0">
				<tr>
					<td style="font-size:16px;font-weight:700;color:#333">Total</td>
					<td style="font-size:22px;font-weight:700;color:#00753F;text-align:right">$%.2f</td>
				</tr>
			</table>
		</td>
	</tr>

	<!-- Footer -->
	<tr>
		<td style="background:#f9f9f9;padding:20px 30px;text-align:center;border-top:1px solid #eee">
			<p style="margin:0;font-size:12px;color:#666;font-weight:600">La Pale</p>
			<p style="margin:3px 0 0;font-size:11px;color:#999">C. Ignacio Perez 87-Norte, Centro, 76000 San Luis Potosi, Qro.</p>
			<p style="margin:3px 0 0;font-size:11px;color:#999">Gracias por tu compra</p>
		</td>
	</tr>

</table>
</td></tr>
</table>
</body>
</html>`, req.TicketNumero, metodoLabel, itemsHTML.String(), req.Total)
}
