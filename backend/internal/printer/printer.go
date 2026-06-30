package printer

import (
	"bytes"
	"fmt"
	"net"
	"time"
)

type Ticket struct {
	NombreTienda string
	Folio        string
	Fecha        string
	Vendedor     string
	Items        []TicketItem
	Subtotal     float64
	Descuento    float64
	Total        float64
	MetodoPago   string
	Efectivo     float64
	Cambio       float64
}

type TicketItem struct {
	Nombre   string
	Cantidad float64
	Precio   float64
	Subtotal float64
}

func PrintTicket(device string, t *Ticket) error {
	if device == "mock" {
		fmt.Printf("[MOCK] Ticket: %s Total: %.2f\n", t.Folio, t.Total)
		return nil
	}
	data := buildESCPOS(t)
	return sendToDevice(device, data)
}

func OpenCashDrawer(device string) error {
	if device == "mock" {
		fmt.Println("[MOCK] Abriendo cajón")
		return nil
	}
	// Pulso para abrir cajón pin 2
	cmd := []byte{0x1B, 0x70, 0x00, 0x19, 0xFA}
	return sendToDevice(device, cmd)
}

func sendToDevice(device string, data []byte) error {
	conn, err := net.DialTimeout("tcp", device, 5*time.Second)
	if err != nil {
		return fmt.Errorf("no se pudo conectar a la impresora: %w", err)
	}
	defer conn.Close()
	conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	_, err = conn.Write(data)
	return err
}

func buildESCPOS(t *Ticket) []byte {
	var b bytes.Buffer

	b.Write([]byte{0x1B, 0x40})       // inicializar
	b.Write([]byte{0x1B, 0x61, 0x01}) // centrar
	b.Write([]byte{0x1B, 0x45, 0x01}) // negrita on
	b.WriteString(t.NombreTienda + "\n")
	b.Write([]byte{0x1B, 0x45, 0x00}) // negrita off
	b.WriteString("================================\n")
	b.Write([]byte{0x1B, 0x61, 0x00}) // izquierda
	b.WriteString(fmt.Sprintf("Folio:    %s\n", t.Folio))
	b.WriteString(fmt.Sprintf("Fecha:    %s\n", t.Fecha))
	b.WriteString(fmt.Sprintf("Vendedor: %s\n", t.Vendedor))
	b.WriteString("================================\n")

	for _, item := range t.Items {
		b.WriteString(fmt.Sprintf("%-20s x%.0f\n", item.Nombre, item.Cantidad))
		b.WriteString(fmt.Sprintf("  $%.2f c/u = $%.2f\n", item.Precio, item.Subtotal))
	}

	b.WriteString("--------------------------------\n")
	if t.Descuento > 0 {
		b.WriteString(fmt.Sprintf("%-20s $%.2f\n", "Descuento:", -t.Descuento))
	}
	b.Write([]byte{0x1B, 0x45, 0x01}) // negrita
	b.WriteString(fmt.Sprintf("%-20s $%.2f\n", "TOTAL:", t.Total))
	b.Write([]byte{0x1B, 0x45, 0x00})
	if t.MetodoPago == "EFECTIVO" && t.Efectivo > 0 {
		b.WriteString(fmt.Sprintf("%-20s $%.2f\n", "Efectivo:", t.Efectivo))
		b.WriteString(fmt.Sprintf("%-20s $%.2f\n", "Cambio:", t.Cambio))
	}
	b.WriteString("================================\n")
	b.Write([]byte{0x1B, 0x61, 0x01}) // centrar
	b.WriteString("Gracias por tu compra!\n")
	b.WriteString("\n\n\n")
	b.Write([]byte{0x1D, 0x56, 0x41, 0x05}) // cortar

	return b.Bytes()
}
