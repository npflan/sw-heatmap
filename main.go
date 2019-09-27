package main

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"time"

	"go.uber.org/zap"
)

type Service struct {
	Client *http.Client
}

type PromBody struct {
	UserID int    `json:"userId"`
	ID     int    `json:"id"`
	Title  string `json:"title"`
	Body   string `json:"body"`
}

type SwitchInfo struct {
	Name string `json:"name"`
	Num  int    `json:"num"`
}

var (
	promURL = "https://jsonplaceholder.typicode.com/posts/1"
	logger  = zap.NewExample()
)

func (s *Service) getProm(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Access-Control-Allow-Origin", "*")
	req, err := http.NewRequest("GET", promURL, nil)
	if err != nil {
		logger.Error(
			"Failed to create request",
			zap.Error(err),
		)
	}

	resp, err := s.Client.Do(req)
	if err != nil {
		logger.Error(
			"Failed to call prometheus",
			zap.Error(err),
		)
		http.Error(w, err.Error(), 500)
		return
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		logger.Error(
			"Failed to read prom response body",
			zap.Error(err),
		)
		http.Error(w, err.Error(), 500)
		return
	}

	var promResp PromBody
	err = json.Unmarshal(body, &promResp)
	if err != nil {
		logger.Error(
			"Unmarshal json failed",
			zap.Error(err),
		)
		http.Error(w, err.Error(), 500)
		return
	}

	var info SwitchInfo
	info.Name = "AA"
	info.Num = 1
	infoList := make([]SwitchInfo, 0, 0)
	infoList = append(infoList, info)
	info.Name = "AB"
	info.Num = 1
	infoList = append(infoList, info)
	info.Name = "AA"
	info.Num = 2
	infoList = append(infoList, info)

	output, err := json.Marshal(infoList)
	if err != nil {
		logger.Error(
			"Failed to create request",
			zap.Error(err),
		)
		http.Error(w, err.Error(), 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(output)

	if err != nil {
		logger.Error(
			"Failed to write response",
			zap.Error(err),
		)
		http.Error(w, err.Error(), 500)
		return
	}
	return
}

func serve() error {
	tr := &http.Transport{
		MaxIdleConns:    10,
		IdleConnTimeout: 30 * time.Second,
	}
	client := &http.Client{Transport: tr}

	svc := Service{
		Client: client,
	}

	http.HandleFunc("/", svc.getProm)
	logger.Info("Work work")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		return err
	}
	return nil
}

func main() {
	err := serve()
	if err != nil {
		panic(err)
	}
}
