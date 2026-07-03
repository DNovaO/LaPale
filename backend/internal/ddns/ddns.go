package ddns

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

func UpdateNoIP(ip string) error {
	hostname := os.Getenv("NOIP_HOSTNAME")
	password := os.Getenv("NOIP_PASSWORD")
	username := os.Getenv("NOIP_USERNAME")

	url := fmt.Sprintf("https://dynupdate.no-ip.com/nic/update?hostname=%s&myip=%s", hostname, ip)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}

	req.SetBasicAuth(username, password)
	req.Header.Set("User-Agent", "LaPale-System/1.0 d_novao@hotmail.com")

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

func ExtractIP(forwarded, remoteIP string) string {
	if forwarded != "" {
		return strings.TrimSpace(strings.Split(forwarded, ",")[0])
	}
	if idx := strings.LastIndex(remoteIP, ":"); idx != -1 {
		return remoteIP[:idx]
	}
	return remoteIP
}
